// src/hooks/useOrgMembersCount.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface UseOrgMembersCountResult {
  count: number;
  loading: boolean;
  error: string | null;
}

export const useOrgMembersCount = (orgId?: string | null): UseOrgMembersCountResult => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(!!orgId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      setCount(0);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchCount = async () => {
      const { count, error } = await supabase
        .from("organization_members")
        .select("user_id", { count: "exact", head: true })
        .eq("org_id", orgId);

      if (!isMounted) return;

      if (error) {
        console.error("[useOrgMembersCount] error:", error);
        setError(error.message);
        setCount(0);
      } else {
        setCount(count ?? 0);
      }
      setLoading(false);
    };

    fetchCount();

    return () => {
      isMounted = false;
    };
  }, [orgId]);

  return { count, loading, error };
};
