import React, {createContext, useContext, useEffect, useMemo, useRef, useState,} from "react";
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

/** pending actions (invite / create org) */
type PendingAction =
    | { kind: "invite"; token: string; userName: string }
    | { kind: "create_org"; orgName: string; userName: string };

const PENDING_KEY = "pending_actions_v1";

/**
 * Multi-tab safe lock for pending processing (same user).
 * Prevents race: tab A + tab B read same pending, both create org.
 */
const PENDING_LOCK_KEY = "pending_actions_lock_v1";
const PENDING_LOCK_TTL_MS = 60_000;

function readPending(): PendingAction[] {
    try {
        const raw = localStorage.getItem(PENDING_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writePending(actions: PendingAction[]) {
    try {
        localStorage.setItem(PENDING_KEY, JSON.stringify(actions));
    } catch {
        // ignore
    }
}

function clearPending() {
    try {
        localStorage.removeItem(PENDING_KEY);
    } catch {
        // ignore
    }
}

function tryAcquirePendingLock(userId: string): boolean {
    try {
        const raw = localStorage.getItem(PENDING_LOCK_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            const ts = Number(parsed?.ts || 0);
            const lockedUserId = String(parsed?.userId || "");

            // If the lock is for the same user and still valid => don't process
            if (lockedUserId === userId && Date.now() - ts < PENDING_LOCK_TTL_MS) {
                return false;
            }
        }

        localStorage.setItem(PENDING_LOCK_KEY, JSON.stringify({ts: Date.now(), userId}));
        return true;
    } catch {
        // If localStorage fails, we can't coordinate across tabs,
        // but we still allow processing (best-effort).
        return true;
    }
}

function releasePendingLock(userId: string) {
    try {
        const raw = localStorage.getItem(PENDING_LOCK_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (String(parsed?.userId || "") === userId) {
            localStorage.removeItem(PENDING_LOCK_KEY);
        }
    } catch {
        // ignore
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

    // Guards against re-entrancy in the same tab / render
    const pendingProcessingRef = useRef(false);

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

        return (data || []).map((item: any) => ({
            org_id: item.org_id,
            role: item.role as RoleEnum,
            organization: Array.isArray(item.organization) ? item.organization[0] : item.organization,
        })) as OrganizationMembership[];
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
                // ignore
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

                const defaultOrg = lastOrgId
                    ? orgs.find((o) => o.org_id === lastOrgId) || orgs[0]
                    : orgs[0];

                setCurrentOrg(defaultOrg);
                try {
                    localStorage.setItem("currentOrgId", defaultOrg.org_id);
                } catch {
                    // ignore
                }
            } else {
                console.warn("[AuthContext] user has no organizations", {userId: effectiveUserId});
                setCurrentOrg(null);
                try {
                    localStorage.removeItem("currentOrgId");
                } catch {
                    // ignore
                }
            }
        } finally {
            setOrgLoading(false);
        }
    };

    /**
     * ✅ Pending zpracování: multi-tab safe.
     * - vyžádá si lock (localStorage) per user
     * - pending se "atomic" vyzvedne: přečíst + hned clear (takže 2. tab už nic neuvidí)
     * - když processing failne, pending se vrátí zpět
     */
    const processPendingActions = async (sessionUser: User) => {
        if (pendingProcessingRef.current) return;
        pendingProcessingRef.current = true;

        const userId = sessionUser.id;

        const gotLock = tryAcquirePendingLock(userId);
        if (!gotLock) {
            pendingProcessingRef.current = false;
            return;
        }

        let actions: PendingAction[] = [];

        try {
            actions = readPending();
            if (actions.length === 0) return;

            // ✅ klíčová změna: clear hned, aby 2. tab už nic nezpracoval
            clearPending();

            const fallbackName =
                (sessionUser.user_metadata?.full_name as string | undefined) ||
                (sessionUser.email ? sessionUser.email.split("@")[0] : "");

            for (const a of actions) {
                if (a.kind === "invite") {
                    const userName = a.userName?.trim() ? a.userName.trim() : fallbackName;

                    const {error} = await supabase.rpc("accept_organization_invite", {
                        p_token: a.token,
                        p_user_name: userName,
                    });
                    if (error) throw error;
                }

                if (a.kind === "create_org") {
                    const userName = a.userName?.trim() ? a.userName.trim() : fallbackName;

                    /**
                     * ✅ SECURITY FIX: nová DB funkce už NEbere p_user_id,
                     * uvnitř používá auth.uid().
                     */
                    const {error} = await supabase.rpc("create_organization_with_owner", {
                        p_org_name: a.orgName,
                        p_user_name: userName,
                    });
                    if (error) throw error;
                }
            }
        } catch (e) {
            // Když to failne, pending vrátíme zpátky (ať se neztratí).
            if (actions.length > 0) {
                // prepend: ať se to zkusí znovu hned
                const current = readPending();
                writePending([...actions, ...current]);
            }
            throw e;
        } finally {
            releasePendingLock(userId);
            pendingProcessingRef.current = false;
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

                // ✅ init: refresh orgs (pending se řeší přes onAuthStateChange INITIAL_SESSION / SIGNED_IN)
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
        } = supabase.auth.onAuthStateChange(async (event, s) => {
            if (!mounted) return;

            setSession(s);
            setUser(s?.user ?? null);
            setLoading(false);

            if (!s?.user) {
                setOrganizations([]);
                setCurrentOrg(null);
                try {
                    localStorage.removeItem("currentOrgId");
                } catch {
                    // ignore
                }
                return;
            }

            // 1) refresh orgs quickly
            refreshOrganizations(s.user.id).catch((e) => {
                console.error("[AuthContext] onAuthStateChange refreshOrganizations failed:", e);
                setOrganizations([]);
                setCurrentOrg(null);
            });

            // 2) pending actions – process on SIGNED_IN + INITIAL_SESSION
            // INITIAL_SESSION je důležité pro callback tab, kde už session existuje.
            if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
                processPendingActions(s.user)
                    .then(() => refreshOrganizations(s.user.id).catch(() => {
                    }))
                    .catch((e) => console.error("[AuthContext] processPendingActions failed:", e));
            }
        });

        return () => {
            mounted = false;
            try {
                subscription.unsubscribe();
            } catch {
                // ignore
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
        const emailRedirectTo =
            import.meta.env.VITE_AUTH_CALLBACK_URL || `${window.location.origin}/${lang}/auth/callback`;

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
        const emailRedirectTo =
            import.meta.env.VITE_AUTH_CALLBACK_URL || `${window.location.origin}/${lang}/auth/callback`;

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
            // ignore
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
                // ignore
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
