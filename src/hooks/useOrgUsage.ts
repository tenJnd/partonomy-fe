// src/hooks/useOrgUsage.ts
import {useEffect, useState} from "react";
import {supabase} from "../lib/supabase";

export interface OrgUsageRow {
    id: string;
    org_id: string;
    period_start: string;
    period_end: string;
    jobs_used: number;
}

interface UseOrgUsageResult {
    usage: OrgUsageRow | null;
    loading: boolean;
    error: string | null;
}

export const useOrgUsage = (orgId?: string | null): UseOrgUsageResult => {
    const [usage, setUsage] = useState<OrgUsageRow | null>(null);
    const [loading, setLoading] = useState<boolean>(!!orgId);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!orgId) {
            setUsage(null);
            setLoading(false);
            return;
        }

        let isMounted = true;
        setLoading(true);
        setError(null);

        const fetchUsage = async () => {
            const {data, error} = await supabase
                .from("organization_usage")
                .select("*")
                .eq("org_id", orgId)
                .order("period_start", {ascending: false})
                .limit(1);

            if (!isMounted) return;

            if (error) {
                console.error("[useOrgUsage] error:", error);
                setError(error.message);
                setUsage(null);
            } else {
                setUsage((data && data.length > 0 ? data[0] : null) as OrgUsageRow | null);
            }
            setLoading(false);
        };

        fetchUsage();

        return () => {
            isMounted = false;
        };
    }, [orgId]);

    return {usage, loading, error};
};
