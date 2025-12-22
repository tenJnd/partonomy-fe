import {useEffect, useState} from "react";
import {supabase} from "../lib/supabase";

export type OrgProfileRow = {
    org_id: string;
    report_lang: string | null;
    profile_text: string | null;
    created_at?: string;
    last_updated?: string;
};

export function useOrgProfile(orgId?: string) {
    const [profile, setProfile] = useState<OrgProfileRow | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        if (!orgId) {
            setProfile(null);
            setLoading(false);
            setError("");
            return;
        }

        let cancelled = false;

        const run = async () => {
            setLoading(true);
            setError("");

            const {data, error} = await supabase
                .from("organization_profiles")
                .select("org_id, report_lang, profile_text, created_at, last_updated")
                .eq("org_id", orgId)
                .maybeSingle();

            if (cancelled) return;

            if (error) {
                setError(error.message);
                setProfile(null);
            } else {
                setProfile(data ?? null);
            }

            setLoading(false);
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [orgId]);

    return {profile, loading, error};
}
