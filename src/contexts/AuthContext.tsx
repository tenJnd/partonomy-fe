import React, {createContext, useContext, useEffect, useState} from 'react';
import {AuthError, Session, User} from '@supabase/supabase-js';
import {supabase} from '../lib/supabase';
import {RoleEnum} from '../lib/database.types';

interface OrganizationMembership {
    org_id: string;
    role: RoleEnum;
    organization: {
        id: string;
        name: string;
    };
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    currentOrg: OrganizationMembership | null;
    organizations: OrganizationMembership[];
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (
        email: string,
        password: string,
        fullName?: string
    ) => Promise<{ data: any; error: AuthError | null }>;
    signOut: () => Promise<void>;
    switchOrganization: (orgId: string) => void;
    // ⬇⬇ DŮLEŽITÉ: userId může přijít zvenku (např. ze Signup)
    refreshOrganizations: (userId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [organizations, setOrganizations] = useState<OrganizationMembership[]>([]);
    const [currentOrg, setCurrentOrg] = useState<OrganizationMembership | null>(null);

    // Fetch user's organizations
    const fetchOrganizations = async (userId: string) => {
        console.log('[AuthContext] Fetching organizations for userId:', userId);

        const {data, error} = await supabase
            .from('organization_members')
            .select(`
        org_id,
        role,
        organization:organizations(id, name)
      `)
            .eq('user_id', userId);

        console.log('[AuthContext] Query result:', {data, error});

        if (error) {
            console.error('[AuthContext] Error fetching organizations:', error);
            return [];
        }

        if (!data || data.length === 0) {
            console.warn('[AuthContext] No organization memberships found for user:', userId);
            return [];
        }

        const mapped = (data || []).map(item => {
            console.log('[AuthContext] Mapping item:', item);
            return {
                org_id: item.org_id,
                role: item.role as RoleEnum,
                organization: Array.isArray(item.organization)
                    ? item.organization[0]
                    : item.organization,
            };
        }) as OrganizationMembership[];

        console.log('[AuthContext] Mapped organizations:', mapped);
        return mapped;
    };

    // ⬇⬇ DŮLEŽITÉ: bere volitelně userId – když přijde, ignoruje user z contextu
    const refreshOrganizations = async (userIdOverride?: string) => {
        const effectiveUserId = userIdOverride ?? user?.id;

        if (!effectiveUserId) {
            console.warn('[AuthContext] refreshOrganizations called with no user');
            setOrganizations([]);
            setCurrentOrg(null);
            return;
        }

        const orgs = await fetchOrganizations(effectiveUserId);
        setOrganizations(orgs);

        if (orgs.length > 0) {
            const lastOrgId = localStorage.getItem('currentOrgId');
            const defaultOrg = lastOrgId
                ? orgs.find(o => o.org_id === lastOrgId) || orgs[0]
                : orgs[0];

            setCurrentOrg(defaultOrg);
            console.log('[AuthContext] refreshOrganizations set currentOrg:', defaultOrg.organization.name);
        } else {
            console.warn('[AuthContext] refreshOrganizations found no orgs');
            setCurrentOrg(null);
        }
    };

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            try {
                const timeoutId = setTimeout(() => {
                    console.error('[AuthContext] getSession() timed out after 5 seconds');
                    setLoading(false);
                }, 5000);

                const {
                    data: {session},
                } = await supabase.auth.getSession();
                clearTimeout(timeoutId);

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    // ⬇⬇ máme k dispozici session.user.id, rovnou ho použijeme
                    await refreshOrganizations(session.user.id);
                }
            } catch (err) {
                console.error('[AuthContext] Error initializing auth:', err);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const {
            data: {subscription},
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[AuthContext] Auth state changed:', event, session?.user?.id);
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                if (event === 'SIGNED_IN') {
                    console.log('[AuthContext] User signed in, refreshing orgs...');
                    refreshOrganizations(session.user.id).catch(err => {
                        console.error('[AuthContext] Error refreshing organizations:', err);
                        setOrganizations([]);
                        setCurrentOrg(null);
                    });
                }
            } else {
                setOrganizations([]);
                setCurrentOrg(null);
            }

            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const signIn = async (email: string, password: string) => {
        const {error} = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return {error};
    };

    const signUp = async (email: string, password: string, fullName?: string) => {
        const {data, error} = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: fullName ? {full_name: fullName} : {},
            },
        });
        return {data, error};
    };


    const signOut = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('currentOrgId');
        setCurrentOrg(null);
        setOrganizations([]);
    };

    const switchOrganization = (orgId: string) => {
        const org = organizations.find(o => o.org_id === orgId);
        if (org) {
            setCurrentOrg(org);
            localStorage.setItem('currentOrgId', orgId);
        }
    };

    const value: AuthContextType = {
        user,
        session,
        loading,
        currentOrg,
        organizations,
        signIn,
        signUp,
        signOut,
        switchOrganization,
        refreshOrganizations,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
