import {supabase} from './supabase';
import type {Database} from './database.types';

type Document = Database['public']['Tables']['documents']['Row'];
type Part = Database['public']['Tables']['parts']['Row'];
type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
type PartInsert = Database['public']['Tables']['parts']['Insert'];
type PartUpdate = Database['public']['Tables']['parts']['Update'];

/**
 * DOCUMENTS
 * All document operations require org_id for multi-tenancy
 */

// Fetch all documents for an organization with their parts
export async function getDocuments(orgId: string) {
    const {data, error} = await supabase
        .from('documents')
        .select(`
      *,
      parts:document_parts(
        part_id,
        parts(*)
      )
    `)
        .eq('org_id', orgId)
        .order('created_at', {ascending: false});

    if (error) throw error;
    return data;
}

// Fetch a single document by ID (org check handled by RLS)
export async function getDocumentById(id: string, orgId: string) {
    const {data, error} = await supabase
        .from('documents')
        .select(`
      *,
      parts:document_parts(
        part_id,
        last_job_id,
        parts(*)
      )
    `)
        .eq('id', id)
        .eq('org_id', orgId)
        .single();

    if (error) throw error;
    return data;
}

// Create a new document
export async function createDocument(document: DocumentInsert) {
    const {data, error} = await supabase
        .from('documents')
        .insert(document)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Update a document
export async function updateDocument(id: string, orgId: string, updates: Partial<Document>) {
    const {data, error} = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Delete a document (requires owner/admin role via RLS)
export async function deleteDocument(id: string, orgId: string) {
    const {error} = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('org_id', orgId);

    if (error) throw error;
}

/**
 * PARTS
 * All part operations require org_id for multi-tenancy
 */

// Fetch all parts for an organization
export async function getParts(orgId: string) {
    const {data, error} = await supabase
        .from('parts')
        .select(`
      *,
      documents:document_parts(
        document_id,
        documents(*)
      )
    `)
        .eq('org_id', orgId)
        .order('created_at', {ascending: false});

    if (error) throw error;
    return data;
}

// Fetch parts by document ID
export async function getPartsByDocumentId(documentId: string, orgId: string) {
    const {data, error} = await supabase
        .from('document_parts')
        .select(`
      *,
      parts(*)
    `)
        .eq('document_id', documentId)
        .order('created_at', {ascending: true});

    if (error) throw error;

    // Extract just the parts with org filtering
    return (data || [])
        .map(dp => dp.parts)
        .filter(part => part && part.org_id === orgId);
}

// Fetch a single part by ID
export async function getPartById(id: string, orgId: string) {
    const {data, error} = await supabase
        .from('parts')
        .select('*')
        .eq('id', id)
        .eq('org_id', orgId)
        .single();

    if (error) throw error;
    return data;
}

// Create a new part
export async function createPart(part: PartInsert) {
    const {data, error} = await supabase
        .from('parts')
        .insert(part)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Update a part
export async function updatePart(id: string, orgId: string, updates: PartUpdate) {
    const {data, error} = await supabase
        .from('parts')
        .update(updates)
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Delete a part
export async function deletePart(id: string, orgId: string) {
    const {error} = await supabase
        .from('parts')
        .delete()
        .eq('id', id)
        .eq('org_id', orgId);

    if (error) throw error;
}

/**
 * JOBS
 */

// Fetch all jobs for an organization
export async function getJobs(orgId: string) {
    const {data, error} = await supabase
        .from('jobs')
        .select(`
      *,
      documents(*)
    `)
        .eq('org_id', orgId)
        .order('created_at', {ascending: false});

    if (error) throw error;
    return data;
}

// Fetch jobs by document ID
export async function getJobsByDocumentId(documentId: string, orgId: string) {
    const {data, error} = await supabase
        .from('jobs')
        .select('*')
        .eq('document_id', documentId)
        .eq('org_id', orgId)
        .order('created_at', {ascending: false});

    if (error) throw error;
    return data;
}

/**
 * ORGANIZATION MANAGEMENT
 */

// Get user's organizations
export async function getUserOrganizations(userId: string) {
    const {data, error} = await supabase
        .from('organization_members')
        .select(`
      org_id,
      role,
      organizations(id, name, created_at)
    `)
        .eq('user_id', userId);

    if (error) throw error;
    return data;
}

// Check if user has admin/owner role in org
export async function isOrgAdmin(userId: string, orgId: string): Promise<boolean> {
    const {data, error} = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .single();

    if (error || !data) return false;
    return ['owner', 'admin'].includes(data.role);
}

/**
 * REAL-TIME SUBSCRIPTIONS
 */

// Subscribe to changes on documents table for an org
export function subscribeToDocuments(
    orgId: string,
    callback: (payload: any) => void
) {
    return supabase
        .channel(`documents-${orgId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'documents',
                filter: `org_id=eq.${orgId}`,
            },
            callback
        )
        .subscribe();
}

// Subscribe to changes on parts table for an org
export function subscribeToParts(
    orgId: string,
    callback: (payload: any) => void
) {
    return supabase
        .channel(`parts-${orgId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'parts',
                filter: `org_id=eq.${orgId}`,
            },
            callback
        )
        .subscribe();
}

/**
 * STORAGE HELPERS
 * Storage paths should be organized by org_id
 */

// Upload a file to org-specific folder in Supabase Storage
export async function uploadFile(
    bucket: string,
    orgId: string,
    fileName: string,
    file: File
) {
    const filePath = `${orgId}/${fileName}`;

    const {data, error} = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) throw error;
    return data;
}

// Get public URL for a file in org folder
export function getPublicUrl(bucket: string, orgId: string, fileName: string) {
    const filePath = `${orgId}/${fileName}`;
    const {data} = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    return data.publicUrl;
}

// Delete a file from org folder
export async function deleteFile(bucket: string, orgId: string, fileName: string) {
    const filePath = `${orgId}/${fileName}`;

    const {error} = await supabase.storage
        .from(bucket)
        .remove([filePath]);

    if (error) throw error;
}

// List files in org folder
export async function listFiles(bucket: string, orgId: string) {
    const {data, error} = await supabase.storage
        .from(bucket)
        .list(orgId);

    if (error) throw error;
    return data;
}
