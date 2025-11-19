import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { RoleEnum } from '../lib/database.types';

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
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  switchOrganization: (orgId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<OrganizationMembership[]>([]);
  const [currentOrg, setCurrentOrg] = useState<OrganizationMembership | null>(null);

  // Fetch user's organizations
  const fetchOrganizations = async (userId: string) => {
    console.log('[AuthContext] Fetching organizations for userId:', userId);

    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        org_id,
        role,
        organization:organizations(id, name)
      `)
      .eq('user_id', userId);

    console.log('[AuthContext] Query result:', { data, error });

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
          : item.organization
      };
    }) as OrganizationMembership[];

    console.log('[AuthContext] Mapped organizations:', mapped);
    return mapped;
  };

  // Initialize auth state
  useEffect(() => {
    // Clear any corrupted session data
    const initAuth = async () => {
      try {
        // Add timeout to detect hanging requests
        const timeoutId = setTimeout(() => {
          console.error('[AuthContext] getSession() timed out after 5 seconds');
          setLoading(false);
        }, 5000);

        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        clearTimeout(timeoutId);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const orgs = await fetchOrganizations(session.user.id);
          setOrganizations(orgs);

          // Get last selected org from localStorage or use first org
          const lastOrgId = localStorage.getItem('currentOrgId');
          const defaultOrg = lastOrgId
            ? orgs.find(o => o.org_id === lastOrgId) || orgs[0]
            : orgs[0];

          setCurrentOrg(defaultOrg || null);
        }
      } catch (err) {
        console.error('[AuthContext] Error initializing auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Don't block on fetching organizations during signup
          // The signup flow will handle org creation
          if (event === 'SIGNED_IN') {
            console.log('[AuthContext] User signed in, fetching orgs...');
            fetchOrganizations(session.user.id)
              .then(orgs => {
                console.log('[AuthContext] Orgs loaded:', orgs.length);
                setOrganizations(orgs);

                if (orgs.length > 0) {
                  const lastOrgId = localStorage.getItem('currentOrgId');
                  const defaultOrg = lastOrgId
                    ? orgs.find(o => o.org_id === lastOrgId) || orgs[0]
                    : orgs[0];
                  setCurrentOrg(defaultOrg);
                  console.log('[AuthContext] Set current org:', defaultOrg.organization.name);
                } else {
                  console.warn('[AuthContext] No organizations found for user');
                }
              })
              .catch(err => {
                console.error('[AuthContext] Error fetching organizations:', err);
                setOrganizations([]);
                setCurrentOrg(null);
              });
          }
        } else {
          setOrganizations([]);
          setCurrentOrg(null);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
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

  const value = {
    user,
    session,
    loading,
    currentOrg,
    organizations,
    signIn,
    signUp,
    signOut,
    switchOrganization,
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
