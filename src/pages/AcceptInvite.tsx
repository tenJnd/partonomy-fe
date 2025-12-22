import React, {useEffect, useMemo, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {AlertCircle, CheckCircle, Loader} from "lucide-react";
import {supabase} from "../lib/supabase";
import {useAuth} from "../contexts/AuthContext";
import {useTranslation} from "react-i18next";
import {useLang} from "../hooks/useLang";

const AcceptInvite: React.FC = () => {
    const {token} = useParams<{ token: string }>();
    const navigate = useNavigate();
    const {user, refreshOrganizations} = useAuth();
    const {t} = useTranslation();
    const lang = useLang();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [orgName, setOrgName] = useState("");

    const tokenSafe = useMemo(() => (token ?? "").trim(), [token]);

    useEffect(() => {
        // invalid URL → bounce
        if (!tokenSafe) {
            navigate(`/${lang}/login`, {replace: true});
            return;
        }

        // Not logged in → store token for Signup and redirect to signup (invite mode)
        if (!user) {
            try {
                sessionStorage.setItem("pendingInviteToken", tokenSafe);
            } catch {
                // ignore
            }
            navigate(`/${lang}/signup?mode=invite`, {replace: true});
            return;
        }

        // Logged in → accept immediately
        const run = async () => {
            setLoading(true);
            setError("");
            setSuccess(false);

            try {
                const displayName =
                    (user.user_metadata && (user.user_metadata.full_name as string)) ||
                    (user.email ? user.email.split("@")[0] : "User");

                const {data, error: fnError} = await supabase.rpc("accept_organization_invite", {
                    p_token: tokenSafe,
                    p_user_name: displayName,
                });

                if (fnError) throw fnError;

                const result = Array.isArray(data) ? data[0] : null;
                if (!result?.success) {
                    setError(result?.message || t("auth.failedToAcceptInvite"));
                    return;
                }

                // Fetch org name (nice UX)
                if (result.org_id) {
                    const {data: orgData} = await supabase
                        .from("organizations")
                        .select("name")
                        .eq("id", result.org_id)
                        .single();

                    if (orgData?.name) setOrgName(orgData.name);
                }

                setSuccess(true);

                // refresh org list in context
                try {
                    await refreshOrganizations(user.id);
                } catch {
                    // ignore
                }

                // go to app
                setTimeout(() => navigate(`/${lang}/app/documents`, {replace: true}), 1200);
            } catch (err: any) {
                setError(err?.message || t("auth.failedToAcceptInvite"));
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [tokenSafe, user, navigate, refreshOrganizations, lang, t]);

    // While redirecting unauth users
    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
                <div className="text-center">
                    <p className="text-gray-700 font-medium">{t("auth.redirectingToSignup")}</p>
                    <p className="text-xs text-gray-500 mt-1">{t("auth.pleaseWait")}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
                {loading && (
                    <>
                        <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin"/>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                            {t("auth.acceptingInvite")}
                        </h2>
                        <p className="text-sm text-gray-600">{t("auth.pleaseWait")}</p>
                    </>
                )}

                {!loading && success && (
                    <>
                        <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4"/>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                            {t("auth.welcomeTo", {orgName: orgName || "organization"})}
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">{t("auth.successfullyJoined")}</p>
                        <p className="text-xs text-gray-500">{t("auth.redirectingToDashboard")}</p>
                    </>
                )}

                {!loading && !success && error && (
                    <>
                        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-4"/>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                            {t("auth.unableToAcceptInvite")}
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={() => navigate(`/${lang}/login`, {replace: true})}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
                            type="button"
                        >
                            {t("auth.goToLogin")}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default AcceptInvite;
