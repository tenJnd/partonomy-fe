import {createClient} from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables. Please check your .env.local file.'
    );
}

// Test connection
console.log('[Supabase] Initializing client with:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
});

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: localStorage,
    },
    global: {
        fetch: (...args) => {
            console.log('[Supabase] Fetch request:', args[0]);
            return fetch(...args)
                .then(res => {
                    console.log('[Supabase] Fetch response:', res.status, args[0]);
                    return res;
                })
                .catch(err => {
                    console.error('[Supabase] Fetch error:', err, args[0]);
                    throw err;
                });
        },
    },
});

// Export types helper
export type {Database} from './database.types';
