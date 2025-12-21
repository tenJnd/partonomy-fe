// src/components/documents/documentsTable.types.ts
import type React from "react";
import type {PriorityEnum, WorkflowStatusEnum} from "../../lib/database.types";
import type {PartWithDocument} from "../../hooks/useParts";

// Sort fields you already use in PartsManager sorting
export type SortField =
    | "file_name"
    | "primary_class"
    | "drawing_number"
    | "material"
    | "overall_complexity"
    | "fit_level"
    | "workflow_status"
    | "priority"
    | "last_updated"
    | "last_status";

export type SortDirection = "asc" | "desc";

export type DocumentsTableCapabilities = {
    // per-row editability (entitlement + handler existence)
    editStatus: boolean;
    editPriority: boolean;
    favorite: boolean;
    projects: boolean;

    // bulk capabilities (entitlement + bulk handler existence + select-all existence)
    bulkStatus: boolean;
    bulkPriority: boolean;
    bulkFavorite: boolean;
    bulkProjects: boolean;

    // selection is possible at all (selectedPartIds + onToggleSelect)
    selection: boolean;

    // bulk bar can actually do anything meaningful (selection + onToggleSelectAll + at least one bulk action)
    bulkActions: boolean;
};

export interface DocumentsTableProps {
    // data / state
    parts: PartWithDocument[];
    loading: boolean;
    uploading?: boolean;
    uploadProgress?: number;

    // sorting
    sortField: SortField;
    sortDirection: SortDirection;
    onSortChange: (field: SortField) => void;

    // navigation / actions
    onRowClick: (documentId: string, partId: string) => void;
    onUploadClick: () => void;

    onRerun: (documentId: string) => void | Promise<void>;
    onDownload: (doc: any) => void | Promise<void>;
    onDelete: (part: PartWithDocument) => void;

    deleteLabel?: string;

    // feature flags (entitlements)
    canUseProjects?: boolean;
    canUseFavorite?: boolean;
    canSetStatus?: boolean;
    canSetPriority?: boolean;

    // favorites
    favoritePartIds?: Set<string>;
    onToggleFavorite?: (part: PartWithDocument) => void | Promise<void>;

    // per-row change handlers
    onChangeWorkflowStatus?: (part: PartWithDocument, value: WorkflowStatusEnum) => void | Promise<void>;
    onChangePriority?: (part: PartWithDocument, value: PriorityEnum) => void | Promise<void>;

    updatingStatusIds?: Set<string>;
    updatingPriorityIds?: Set<string>;

    // selection
    selectedPartIds?: Set<string>;
    onToggleSelect?: (partId: string) => void;
    onToggleSelectAll?: (partIdsOnPage: string[]) => void;

    // project add (row)
    onAddToProject?: (part: PartWithDocument) => void;

    // bulk actions
    onBulkSetStatus?: (partIds: string[], value: WorkflowStatusEnum) => void | Promise<void>;
    onBulkSetPriority?: (partIds: string[], value: PriorityEnum) => void | Promise<void>;
    onBulkToggleFavorite?: (partIds: string[], favorite: boolean) => void | Promise<void>;
    onBulkAddToProject?: (partIds: string[]) => void | Promise<void>;

    // computed capabilities (optional for backwards compatibility)
    capabilities?: DocumentsTableCapabilities;

    // passthrough (if you need in children)
    className?: string;
    style?: React.CSSProperties;
}
