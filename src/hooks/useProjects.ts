// src/hooks/useProjects.ts
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";
import { useAuth } from "../contexts/AuthContext";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

export type ProjectStatus = ProjectRow["status"];
export type ProjectPriority = ProjectRow["priority"];

interface UseProjectsResult {
  projects: ProjectRow[];
  loading: boolean;
  error: string | null;
  createProject: (payload: CreateProjectInput) => Promise<void>;
  updateProject: (id: string, payload: UpdateProjectInput) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export interface CreateProjectInput {
  name: string;
  description?: string | null;
  customer_name?: string | null;
  external_ref?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  due_date?: string | null; // ISO string (bez/z časové zóny – uloží se jako timestamptz)
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

export function useProjects(): UseProjectsResult {
  const { currentOrg, user } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!currentOrg) {
      setProjects([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("org_id", currentOrg.org_id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[useProjects] fetch error:", error);
        setError(error.message ?? "Failed to load projects");
        return;
      }

      setProjects(data ?? []);
    } catch (err: any) {
      console.error("[useProjects] unexpected fetch error:", err);
      setError(err.message ?? "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.org_id]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(
    async (payload: CreateProjectInput) => {
      if (!currentOrg || !user) return;

      const insertPayload = {
        org_id: currentOrg.org_id,
        created_by_user_id: user.id,
        name: payload.name,
        description: payload.description ?? null,
        customer_name: payload.customer_name ?? null,
        external_ref: payload.external_ref ?? null,
        status: payload.status ?? ("open" as ProjectStatus),
        priority: payload.priority ?? ("normal" as ProjectPriority),
        due_date: payload.due_date ?? null,
      };

      const { data, error } = await supabase
        .from("projects")
        .insert(insertPayload)
        .select("*")
        .single();

      if (error) {
        console.error("[useProjects] create error:", error);
        throw new Error(error.message ?? "Failed to create project");
      }

      setProjects((prev) => [data, ...prev]);
    },
    [currentOrg, user]
  );

  const updateProject = useCallback(
    async (id: string, payload: UpdateProjectInput) => {
      if (!currentOrg) return;

      const { data, error } = await supabase
        .from("projects")
        .update({
          ...payload,
        })
        .eq("id", id)
        .eq("org_id", currentOrg.org_id)
        .select("*")
        .single();

      if (error) {
        console.error("[useProjects] update error:", error);
        throw new Error(error.message ?? "Failed to update project");
      }

      setProjects((prev) => prev.map((p) => (p.id === id ? data : p)));
    },
    [currentOrg]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      if (!currentOrg) return;

      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id)
        .eq("org_id", currentOrg.org_id);

      if (error) {
        console.error("[useProjects] delete error:", error);
        throw new Error(error.message ?? "Failed to delete project");
      }

      setProjects((prev) => prev.filter((p) => p.id !== id));
    },
    [currentOrg]
  );

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refresh: fetchProjects,
  };
}
