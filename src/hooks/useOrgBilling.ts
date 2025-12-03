// src/hooks/useOrgBilling.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { TierEnum } from "../lib/database.types";

export interface OrgBilling {
  status: string | null;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  tier: {
    code: TierEnum;
    name: string;
    max_jobs_per_period: number | null;
    max_users: number | null;
    can_comment: boolean | false;
    can_set_favourite: boolean | false;
    can_use_tags: boolean | false;
    can_set_priority: boolean | false;
    can_set_status: boolean | false;
    can_use_projects: boolean | false
  } | null;
}

export function useOrgBilling() {
  const { currentOrg } = useAuth();
  const [billing, setBilling] = useState<OrgBilling | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentOrg) {
      setBilling(null);
      return;
    }

    const fetchBilling = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("organization_billing")
        .select(
          `
          status,
          trial_start,
          trial_end,
          current_period_start,
          current_period_end,
          tier:organization_tiers (
            code,
            name,
            max_jobs_per_period,
            max_users,
            can_comment,
            can_set_favourite,
            can_use_tags,
            can_set_priority,
            can_set_status,
            can_use_projects
          )
        `
        )
        .eq("org_id", currentOrg.org_id)
        .maybeSingle();

      if (error) {
        console.error("[useOrgBilling] Error fetching billing:", error);
        setError(error.message);
        setBilling(null);
      } else {
        // Supabase vrátí tier jako objekt nebo null
        setBilling(data as OrgBilling | null);
      }

      setLoading(false);
    };

    fetchBilling().catch((err) => {
      console.error("[useOrgBilling] Unexpected error:", err);
      setError("Unexpected error");
      setLoading(false);
    });
  }, [currentOrg?.org_id]);

  return { billing, loading, error };
}
