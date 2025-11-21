/**
 * Storage Helper Functions
 *
 * Handles file uploads/downloads with proper path conventions and RLS security.
 *
 * Path Convention: {org_id}/{document_id_or_part_id}/filename.ext
 *
 * Buckets:
 * - documents-raw: Original uploaded documents (PDF, DWG, etc.)
 * - document-thumbnails: Generated thumbnails (PNG/JPEG) - read-only for users
 * - part-renders: Generated part renders (PNG/JPEG) - read-only for users
 */

import {supabase} from './supabase';

// Bucket names
export const BUCKET_DOCUMENTS_RAW = 'documents-raw';
export const BUCKET_DOCUMENT_THUMBNAILS = 'document-thumbnails';
export const BUCKET_PART_RENDERS = 'part-renders';

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Upload a document file to storage
 *
 * @param file - The file to upload
 * @param orgId - Organization ID
 * @param documentId - Document ID (UUID)
 * @param onProgress - Optional progress callback (0-100)
 * @returns Storage key if successful, or error
 */
export async function uploadDocument(
    file: File,
    orgId: string,
    documentId: string,
): Promise<{ key?: string; error?: Error }> {
    try {
        const key = `${orgId}/${documentId}/${file.name}`;

        const {error} = await supabase.storage
            .from(BUCKET_DOCUMENTS_RAW)
            .upload(key, file, {
                upsert: false,
                cacheControl: '3600',
            });

        if (error) {
            return {error: new Error(error.message)};
        }

        return {key};
    } catch (err) {
        return {error: err instanceof Error ? err : new Error('Upload failed')};
    }
}

/**
 * Get a signed URL for downloading/viewing a document
 *
 * @param bucket - Bucket name
 * @param storageKey - Storage key (path)
 * @param expiresIn - URL expiration in seconds (default: 60)
 * @returns Signed URL or error
 */
export async function getSignedUrl(
    bucket: string,
    storageKey: string,
    expiresIn: number = 60
): Promise<{ url?: string; error?: Error }> {
    try {
        const {data, error} = await supabase.storage
            .from(bucket)
            .createSignedUrl(storageKey, expiresIn);

        if (error) {
            return {error: new Error(error.message)};
        }

        if (!data?.signedUrl) {
            return {error: new Error('No signed URL returned')};
        }

        return {url: data.signedUrl};
    } catch (err) {
        return {error: err instanceof Error ? err : new Error('Failed to get signed URL')};
    }
}

/**
 * Get signed URL for document thumbnail
 */
export async function getDocumentThumbnailUrl(
    thumbnailStorageKey: string,
    expiresIn: number = 300
): Promise<{ url?: string; error?: Error }> {
    return getSignedUrl(BUCKET_DOCUMENT_THUMBNAILS, thumbnailStorageKey, expiresIn);
}

/**
 * Get signed URL for part render
 */
export async function getPartRenderUrl(
    renderStorageKey: string,
    expiresIn: number = 300
): Promise<{ url?: string; error?: Error }> {
    return getSignedUrl(BUCKET_PART_RENDERS, renderStorageKey, expiresIn);
}

/**
 * Get signed URL for raw document download
 */
export async function getDocumentDownloadUrl(
    rawStorageKey: string,
    expiresIn: number = 60
): Promise<{ url?: string; error?: Error }> {
    return getSignedUrl(BUCKET_DOCUMENTS_RAW, rawStorageKey, expiresIn);
}

/**
 * Delete a document file from storage
 *
 * @param storageKey - Storage key (path)
 * @returns Success or error
 */
export async function deleteDocument(
    storageKey: string
): Promise<{ error?: Error }> {
    try {
        const {error} = await supabase.storage
            .from(BUCKET_DOCUMENTS_RAW)
            .remove([storageKey]);

        if (error) {
            return {error: new Error(error.message)};
        }

        return {};
    } catch (err) {
        return {error: err instanceof Error ? err : new Error('Delete failed')};
    }
}

/**
 * Validate file before upload
 *
 * @param file - File to validate
 * @param options - Validation options
 * @returns Error if validation fails
 */
export function validateFile(
    file: File,
    options: {
        maxSizeBytes?: number;
        allowedExtensions?: string[];
    } = {}
): Error | null {
    const {
        maxSizeBytes = 50 * 1024 * 1024, // 50MB default
        allowedExtensions = ['pdf', 'dwg', 'dxf'],
    } = options;

    // Check file size
    if (file.size > maxSizeBytes) {
        const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
        return new Error(`File size exceeds ${maxSizeMB}MB limit`);
    }

    // Check extension
    const extension = getFileExtension(file.name);
    if (!allowedExtensions.includes(extension)) {
        return new Error(
            `File type .${extension} not supported. Allowed: ${allowedExtensions.join(', ')}`
        );
    }

    return null;
}
