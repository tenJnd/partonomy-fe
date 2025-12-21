// src/components/projects/projectsTable.types.ts
import type {Database} from "../../lib/database.types";

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

export type ProjectSortField =
    | "name"
    | "customer_name"
    | "external_ref"
    | "status"
    | "priority"
    | "due_date"
    | "created_at";

export interface ProjectsTableProps {
    projects: ProjectRow[];
    loading: boolean;

    sortField: ProjectSortField;
    sortDirection: "asc" | "desc";
    onSortChange: (field: ProjectSortField) => void;

    onRowClick: (projectId: string) => void;
    onEdit: (project: ProjectRow) => void;
    onDelete: (project: ProjectRow) => void;
}
