import {useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {supabase} from "../lib/supabase";
import {useAuth} from "../contexts/AuthContext";
import {useLang} from "../hooks/useLang";

type PendingAction =
    | { kind: "invite"; token: string; userName: string }
    | { kind: "create_org"; orgName: string; userName: string };

const PENDING_KEY = "pending_actions_v1";

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

function clearPending() {
    try {
        localStorage.removeItem(PENDING_KEY);
    } catch {
    }
}

export default function AuthCallback() {
    const navigate = useNavigate();
    const lang = useLang();
    const {refreshOrganizations} = useAuth();

    const [error, setError] = useState<string>("");
    const [phase, setPhase] = useState<"loading" | "error">("loading");

    const safeNext = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        const nextParam = params.get("next");
        if (nextParam && nextParam.startsWith(`/${lang}/`)) return nextParam;
        return `/${lang}/app/documents`;
    }, [lang]);

    useEffect(() => {
        let done = false;
        let timeoutId: number | undefined;

        const finish = async (sessionUser: any) => {
            try {
                // ✅ reset-password flow: nedělej org refresh ani pending akce
                const isResetFlow = safeNext.endsWith(`/${lang}/reset-password`);

                if (!isResetFlow) {
                    const actions = readPending();

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

                            const {error} = await supabase.rpc("create_organization_with_owner_v2", {
                                p_org_name: a.orgName,
                                p_user_id: sessionUser.id,
                                p_user_name: userName,
                                p_report_lang: lang,
                            });
                            if (error) throw error;
                        }
                    }

                    if (actions.length > 0) clearPending();

                    await refreshOrganizations(sessionUser.id);
                }

                done = true;
                if (timeoutId) window.clearTimeout(timeoutId);

                navigate(safeNext, {replace: true});
            } catch (e: any) {
                done = true;
                if (timeoutId) window.clearTimeout(timeoutId);

                setError(e?.message ?? "Failed to finish callback");
                setPhase("error");
            }
        };

        const run = async () => {
            try {
                const {data} = await supabase.auth.getSession();
                if (data.session?.user) {
                    await finish(data.session.user);
                    return;
                }

                const {data: sub} = supabase.auth.onAuthStateChange(async (event, session) => {
                    if (event === "SIGNED_IN" && session?.user) {
                        try {
                            sub.subscription.unsubscribe();
                        } catch {
                        }
                        await finish(session.user);
                    }
                });

                timeoutId = window.setTimeout(() => {
                    try {
                        sub.subscription.unsubscribe();
                    } catch {
                    }
                    if (!done) {
                        setError(
                            "Auth callback did not produce a session. Check Redirect URLs and detectSessionInUrl=true."
                        );
                        setPhase("error");
                    }
                }, 8000); // trochu víc tolerance
            } catch (e: any) {
                setError(e?.message ?? "Auth callback failed");
                setPhase("error");
            }
        };

        run();

        return () => {
            done = true;
            if (timeoutId) window.clearTimeout(timeoutId);
        };
// eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate, safeNext, lang, refreshOrganizations]);


    if (phase === "error") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                    <h1 className="text-lg font-semibold text-gray-900 mb-2">Authentication failed</h1>
                    <p className="text-sm text-gray-700 mb-4">{error}</p>
                    <button
                        onClick={() => navigate(`/${lang}/login`, {replace: true})}
                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
                    >
                        Go to login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <p className="text-sm text-gray-700">Finishing authentication…</p>
            </div>
        </div>
    );
}
