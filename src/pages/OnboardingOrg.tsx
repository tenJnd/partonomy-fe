import {useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {supabase} from "../lib/supabase";
import {useAuth} from "../contexts/AuthContext";

function extractInviteToken(input: string): string {
    try {
        const maybeUrl = new URL(input);
        const parts = maybeUrl.pathname.split("/").filter(Boolean);
        const idx = parts.indexOf("invite");
        if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    } catch {
        // not a URL
    }
    return input.trim();
}

export default function OnboardingOrg() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const {lang} = useParams();

    const safeLang = lang || "en";

    const {user, refreshOrganizations} = useAuth();

    const [inviteInput, setInviteInput] = useState("");
    const [orgName, setOrgName] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>("");

    const acceptInvite = async () => {
        setError("");
        setBusy(true);
        try {
            const token = extractInviteToken(inviteInput);
            if (!token) throw new Error(t("auth.missingInviteToken"));

            const fallbackName =
                (user?.user_metadata?.full_name as string | undefined) ||
                (user?.email ? user.email.split("@")[0] : "");

            const {error} = await supabase.rpc("accept_organization_invite", {
                p_token: token,
                p_user_name: fallbackName,
            });

            if (error) throw error;

            await refreshOrganizations(user?.id);
            navigate(`/${safeLang}/app/documents`, {replace: true});
        } catch (e: any) {
            setError(e?.message ?? t("auth.failedToAcceptInvite"));
        } finally {
            setBusy(false);
        }
    };

    const createOrg = async () => {
        setError("");
        setBusy(true);
        try {
            if (!user) throw new Error(t("auth.noUserSession"));

            const name = orgName.trim();
            if (!name) throw new Error(t("auth.organizationNameRequired"));

            const fallbackName =
                (user.user_metadata?.full_name as string | undefined) ||
                (user.email ? user.email.split("@")[0] : "");

            const {error} = await supabase.rpc("create_organization_with_owner", {
                p_org_name: name,
                p_user_id: user.id,
                p_user_name: fallbackName,
            });

            if (error) throw error;

            await refreshOrganizations(user.id);
            navigate(`/${safeLang}/app/documents`, {replace: true});
        } catch (e: any) {
            setError(e?.message ?? t("auth.signUpError"));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-xl bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <h1 className="text-lg font-semibold text-gray-900">
                    {t("auth.noOrganizationTitle")}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                    {t("auth.noOrganizationDescription")}
                </p>

                {error ? (
                    <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {error}
                    </div>
                ) : null}

                <div className="mt-6 grid gap-6">
                    {/* Join with invite */}
                    <div className="border border-gray-200 rounded-xl p-4">
                        <h2 className="text-sm font-semibold text-gray-900">
                            {t("auth.joinWithInvite")}
                        </h2>
                        <p className="text-xs text-gray-600 mt-1">
                            {t("auth.joinWithInviteDescription")}
                        </p>

                        <label className="block text-xs text-gray-700 mt-3 mb-1">
                            {t("auth.inviteLinkOrToken")}
                        </label>
                        <input
                            value={inviteInput}
                            onChange={(e) => setInviteInput(e.target.value)}
                            placeholder={t("auth.invitePlaceholder")}
                            className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm"
                            disabled={busy}
                        />

                        <button
                            onClick={acceptInvite}
                            disabled={busy}
                            className="mt-3 w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium"
                        >
                            {busy ? t("auth.acceptingInviteShort") : t("auth.acceptInvite")}
                        </button>
                    </div>

                    {/* Create org */}
                    <div className="border border-gray-200 rounded-xl p-4">
                        <h2 className="text-sm font-semibold text-gray-900">
                            {t("auth.createNewOrganization")}
                        </h2>
                        <p className="text-xs text-gray-600 mt-1">
                            {/* přepoužij existující klíč */}
                            {t("auth.youWillBeOwner")}
                        </p>

                        <label className="block text-xs text-gray-700 mt-3 mb-1">
                            {t("auth.organizationName")}
                        </label>
                        <input
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            placeholder={t("auth.organizationName")}
                            className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm"
                            disabled={busy}
                        />

                        <button
                            onClick={createOrg}
                            disabled={busy}
                            className="mt-3 w-full h-11 rounded-lg bg-gray-900 hover:bg-black disabled:opacity-60 text-white text-sm font-medium"
                        >
                            {busy ? t("auth.creatingOrganization") : t("auth.createOrganization")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
