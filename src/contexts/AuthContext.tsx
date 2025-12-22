import React, {createContext, useContext, useEffect, useMemo, useState} from "react";
import {AuthError, Session, User} from "@supabase/supabase-js";
import {supabase} from "../lib/supabase";
import {RoleEnum} from "../lib/database.types";

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

    /** pouze auth/session init (NE org fetch) */
    loading: boolean;

    /** org fetch / membership refresh */
    orgLoading: boolean;

    currentOrg: OrganizationMembership | null;
    organizations: OrganizationMembership[];

    /** user přihlášen, ale nemá žádnou org */
    needsOnboarding: boolean;

    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string, fullName?: string) => Promise<{ data: any; error: AuthError | null }>;
    resendSignupEmail: (email: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    switchOrganization: (orgId: string) => void;
    refreshOrganizations: (userId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getLangFromPath(): string {
    try {
        const seg = window.location.pathname.split("/").filter(Boolean)[0];
        return seg || "en";
    } catch {
        return "en";
    }
}

export function AuthProvider({children}: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);

    // ✅ auth loading = jen getSession + auth event sync (rychlé)
    const [loading, setLoading] = useState(true);

    // ✅ org loading = fetch membership (může trvat / padat, ale nesmí blokovat landing)
    const [orgLoading, setOrgLoading] = useState(false);

    const [organizations, setOrganizations] = useState<OrganizationMembership[]>([]);
    const [currentOrg, setCurrentOrg] = useState<OrganizationMembership | null>(null);

    const fetchOrganizations = async (userId: string) => {
        const {data, error} = await supabase
            .from("organization_members")
            .select(
                `
        org_id,
        role,
        organization:organizations(id, name)
      `
            )
            .eq("user_id", userId);

        if (error) {
            console.error("[AuthContext] Error fetching organizations:", error);
            return [];
        }

        const mapped = (data || []).map((item: any) => ({
            org_id: item.org_id,
            role: item.role as RoleEnum,
            organization: Array.isArray(item.organization) ? item.organization[0] : item.organization,
        })) as OrganizationMembership[];

        return mapped;
    };

    // ⬇⬇ DŮLEŽITÉ: bere volitelně userId – když přijde, ignoruje user z contextu
    const refreshOrganizations = async (userIdOverride?: string) => {
        const effectiveUserId = userIdOverride ?? user?.id;

        if (!effectiveUserId) {
            setOrganizations([]);
            setCurrentOrg(null);
            try {
                localStorage.removeItem("currentOrgId");
            } catch {
            }
            return;
        }

        setOrgLoading(true);
        try {
            const orgs = await fetchOrganizations(effectiveUserId);
            setOrganizations(orgs);

            if (orgs.length > 0) {
                const lastOrgId = (() => {
                    try {
                        return localStorage.getItem("currentOrgId");
                    } catch {
                        return null;
                    }
                })();

                const defaultOrg = lastOrgId ? orgs.find((o) => o.org_id === lastOrgId) || orgs[0] : orgs[0];

                setCurrentOrg(defaultOrg);
                try {
                    localStorage.setItem("currentOrgId", defaultOrg.org_id);
                } catch {
                }
            } else {
                // ✅ LOG-ONLY GUARD (debug)
                console.warn("[AuthContext] user has no organizations", {userId: effectiveUserId});

                setCurrentOrg(null);
                try {
                    localStorage.removeItem("currentOrgId");
                } catch {
                }
            }
        } finally {
            setOrgLoading(false);
        }
    };


    // Initialize auth state (NEčeká na org refresh, aby neblokoval public stránky)
    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                const timeoutId = window.setTimeout(() => {
                    console.error("[AuthContext] getSession() timed out after 5 seconds");
                    if (mounted) setLoading(false);
                }, 5000);

                const {
                    data: {session: s},
                } = await supabase.auth.getSession();

                window.clearTimeout(timeoutId);
                if (!mounted) return;

                setSession(s ?? null);
                setUser(s?.user ?? null);

                // ✅ org refresh spustíme, ale NEblokujeme loading pro public UI
                if (s?.user) {
                    refreshOrganizations(s.user.id).catch((e) => {
                        console.error("[AuthContext] init refreshOrganizations failed:", e);
                        setOrganizations([]);
                        setCurrentOrg(null);
                    });
                } else {
                    setOrganizations([]);
                    setCurrentOrg(null);
                }
            } catch (err) {
                console.error("[AuthContext] Error initializing auth:", err);
                if (!mounted) return;
                setSession(null);
                setUser(null);
                setOrganizations([]);
                setCurrentOrg(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const {
            data: {subscription},
        } = supabase.auth.onAuthStateChange(async (_event, s) => {
            if (!mounted) return;

            setSession(s);
            setUser(s?.user ?? null);

            // ✅ auth loading držíme krátce (jen event), orgLoading řeší zvlášť
            setLoading(false);

            if (s?.user) {
                refreshOrganizations(s.user.id).catch((e) => {
                    console.error("[AuthContext] onAuthStateChange refreshOrganizations failed:", e);
                    setOrganizations([]);
                    setCurrentOrg(null);
                });
            } else {
                setOrganizations([]);
                setCurrentOrg(null);
                try {
                    localStorage.removeItem("currentOrgId");
                } catch {
                }
            }
        });

        return () => {
            mounted = false;
            try {
                subscription.unsubscribe();
            } catch {
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const needsOnboarding = useMemo(() => {
        // user přihlášen + org fetch už doběhl + nemá žádné org
        return !!user && !loading && !orgLoading && organizations.length === 0;
    }, [user, loading, orgLoading, organizations.length]);

    const signIn = async (email: string, password: string) => {
        const {error} = await supabase.auth.signInWithPassword({email, password});
        return {error};
    };

    const signUp = async (email: string, password: string, fullName?: string) => {
        const lang = getLangFromPath();
        const emailRedirectTo = import.meta.env.VITE_AUTH_CALLBACK_URL || `${window.location.origin}/${lang}/auth/callback`;

        const {data, error} = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: fullName ? {full_name: fullName} : {},
                emailRedirectTo,
            },
        });

        // ✅ Supabase: existing email can look like "success" but identities = []
        const u = data?.user ?? data?.session?.user;
        const identities = u?.identities;

        if (!error && u && Array.isArray(identities) && identities.length === 0) {
            const alreadyRegisteredError = {
                name: "AuthApiError",
                status: 400,
                message: "User already registered",
            } as unknown as AuthError;

            return {data, error: alreadyRegisteredError};
        }

        return {data, error};
    };

    const resendSignupEmail = async (email: string) => {
        const lang = getLangFromPath();
        const emailRedirectTo = import.meta.env.VITE_AUTH_CALLBACK_URL || `${window.location.origin}/${lang}/auth/callback`;

        const {error} = await supabase.auth.resend({
            type: "signup",
            email,
            options: {emailRedirectTo},
        });

        return {error};
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        try {
            localStorage.removeItem("currentOrgId");
        } catch {
        }
        setCurrentOrg(null);
        setOrganizations([]);
    };

    const switchOrganization = (orgId: string) => {
        const org = organizations.find((o) => o.org_id === orgId);
        if (org) {
            setCurrentOrg(org);
            try {
                localStorage.setItem("currentOrgId", orgId);
            } catch {
            }
        }
    };

    const value: AuthContextType = {
        user,
        session,
        loading,
        orgLoading,
        currentOrg,
        organizations,
        needsOnboarding,
        signIn,
        signUp,
        resendSignupEmail,
        signOut,
        switchOrganization,
        refreshOrganizations,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
