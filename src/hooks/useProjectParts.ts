// src/hooks/useProjectParts.ts
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";
import { useAuth } from "../contexts/AuthContext";

type PartRow = Database["public"]["Tables"]["parts"]["Row"];
type ProjectPartRow = Database["public"]["Tables"]["project_parts"]["Row"];

interface ProjectPartWithPart extends ProjectPartRow {
  part: PartRow;
}

interface UseProjectPartsResult {
  items: ProjectPartWithPart[];
  loading: boolean;
  error: string | null;
  addPart: (partId: string) => Promise<void>;
  removePart: (projectPartId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useProjectParts(projectId: string | null): UseProjectPartsResult {
  const { currentOrg, user } = useAuth();
  const [items, setItems] = useState<ProjectPartWithPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!projectId || !currentOrg) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // POZN: vyžaduje definovaný FK v Supabase, aby šel použít join syntax níže.
      const { data, error } = await supabase
        .from("project_parts")
        .select("*, part:parts(*)")
        .eq("project_id", projectId)
        .eq("org_id", currentOrg.org_id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[useProjectParts] fetch error:", error);
        setError(error.message ?? "Failed to load project parts");
        return;
      }

      setItems((data as any as ProjectPartWithPart[]) ?? []);
    } catch (err: any) {
      console.error("[useProjectParts] unexpected error:", err);
      setError(err.message ?? "Failed to load project parts");
    } finally {
      setLoading(false);
    }
  }, [projectId, currentOrg?.org_id]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addPart = useCallback(
    async (partId: string) => {
      if (!projectId || !currentOrg || !user) return;

      const { data, error } = await supabase
        .from("project_parts")
        .insert({
          org_id: currentOrg.org_id,
          project_id: projectId,
          part_id: partId,
          added_by_user_id: user.id,
        })
        .select("*, part:parts(*)")
        .single();

      // ignorace duplicate (unique constraint) – pokud nechceš, můžeš udělat explicitní check
      if (error) {
        if ((error as any).code === "23505") {
          // duplicate -> prostě nic
          return;
        }
        console.error("[useProjectParts] addPart error:", error);
        throw new Error(error.message ?? "Failed to add part to project");
      }

      setItems((prev) => [...prev, data as any as ProjectPartWithPart]);
    },
    [projectId, currentOrg, user]
  );

  const removePart = useCallback(
    async (projectPartId: string) => {
      if (!currentOrg) return;

      const { error } = await supabase
        .from("project_parts")
        .delete()
        .eq("id", projectPartId)
        .eq("org_id", currentOrg.org_id);

      if (error) {
        console.error("[useProjectParts] removePart error:", error);
        throw new Error(error.message ?? "Failed to remove part from project");
      }

      setItems((prev) => prev.filter((i) => i.id !== projectPartId));
    },
    [currentOrg]
  );

  return {
    items,
    loading,
    error,
    addPart,
    removePart,
    refresh: fetchItems,
  };
}
