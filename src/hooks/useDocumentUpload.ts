import {useState} from 'react';
import {supabase} from '../lib/supabase';
import {BUCKET_DOCUMENT_THUMBNAILS, BUCKET_DOCUMENTS_RAW, uploadDocument, validateFile,} from '../lib/storageHelpers';

type CurrentOrg = {
    org_id: string;
} | null;

type User = {
    id: string;
} | null;

export function useDocumentUpload(currentOrg: CurrentOrg, user: User) {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState('');

    const uploadFiles = async (files: File[]) => {
        if (!currentOrg || !user || files.length === 0) return;

        setUploadError('');
        setUploadProgress(0);
        setUploading(true);

        let lastError: string | null = null;

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                const validationError = validateFile(file);
                if (validationError) {
                    lastError = validationError.message;
                    continue;
                }

                const baseProgress = Math.round((i / files.length) * 100);
                setUploadProgress(baseProgress);

                // najdeme existující dokument se stejným názvem v rámci organizace
                const {data: existingDoc} = await supabase
                    .from('documents')
                    .select('id')
                    .eq('org_id', currentOrg.org_id)
                    .eq('file_name', file.name)
                    .maybeSingle();

                const documentId = existingDoc?.id || crypto.randomUUID();

                const {key, error: uploadErrorRes} = await uploadDocument(
                    file,
                    currentOrg.org_id,
                    documentId,
                );

                if (uploadErrorRes || !key) {
                    lastError = uploadErrorRes?.message || 'Upload failed';
                    continue;
                }

                setUploadProgress(baseProgress + 30);

                if (existingDoc) {
                    // REUPLOAD: přepíšeme objekt v bucketu (řeší uploadDocument) a resetneme stav výsledků
                    const {error: updateError} = await supabase
                        .from('documents')
                        .update({
                            user_id: user.id,
                            raw_bucket: BUCKET_DOCUMENTS_RAW,
                            raw_storage_key: key,
                            last_status: 'queued',
                        })
                        .eq('id', documentId);

                    if (updateError) {
                        lastError = updateError.message;
                        continue;
                    }
                } else {
                    // NOVÝ dokument
                    const {error: insertError} = await supabase
                        .from('documents')
                        .insert({
                            id: documentId,
                            org_id: currentOrg.org_id,
                            user_id: user.id,
                            file_name: file.name,
                            raw_bucket: BUCKET_DOCUMENTS_RAW,
                            raw_storage_key: key,
                            thumbnail_bucket: BUCKET_DOCUMENT_THUMBNAILS,
                            last_status: 'queued',
                        });

                    if (insertError) {
                        lastError = insertError.message;
                        continue;
                    }
                }

                setUploadProgress(Math.round(((i + 1) / files.length) * 100));
            }
        } finally {
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 500);

            if (lastError) {
                setUploadError(lastError);
            }
        }
    };

    return {
        uploading,
        uploadProgress,
        uploadError,
        setUploadError,
        uploadFiles,
    };
}
