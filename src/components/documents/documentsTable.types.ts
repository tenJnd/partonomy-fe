// src/components/documents/documentsTable.types.ts
import type {PartWithDocument} from "../../hooks/useParts";
import type {PriorityEnum, WorkflowStatusEnum} from "../../lib/database.types";

export type SortField =
    | "file_name"
    | "company_name"
    | "primary_class"
    | "overall_complexity"
    | "fit_level"
    | "last_status"
    | "last_updated";

export type WorkflowStatus = WorkflowStatusEnum | null;
export type Priority = PriorityEnum | null;

export interface DocumentsTableProps {
    parts: PartWithDocument[];
    loading: boolean;
    uploading: boolean;
    uploadProgress: number;
    sortField: SortField;
    sortDirection: "asc" | "desc";
    onSortChange: (field: SortField) => void;
    onUploadClick: () => void;
    onRerun: (docId: string) => void;
    onDownload: (doc: any) => void;
    onDelete: (row: PartWithDocument) => void;
    onRowClick: (documentId: string, partId: string) => void;

    // tier & actions
    canUseProjects?: boolean;
    canUseFavorite?: boolean;
    canSetStatus?: boolean;
    canSetPriority?: boolean;

    deleteLabel?: string;
    onAddToProject?: (part: PartWithDocument) => void;
    favoritePartIds?: Set<string>;
    onToggleFavorite?: (part: PartWithDocument) => void;

    onChangeWorkflowStatus?: (
        part: PartWithDocument,
        value: WorkflowStatusEnum
    ) => void;
    onChangePriority?: (part: PartWithDocument, value: PriorityEnum) => void;

    updatingStatusIds?: Set<string>;
    updatingPriorityIds?: Set<string>;

    // selection + bulk
    selectedPartIds?: Set<string>;
    onToggleSelect?: (partId: string) => void;
    onToggleSelectAll?: (partIdsOnPage: string[]) => void;

    onBulkToggleFavorite?: (partIds: string[], favorite: boolean) => void;
    onBulkSetStatus?: (partIds: string[], status: WorkflowStatusEnum) => void;
    onBulkSetPriority?: (partIds: string[], priority: PriorityEnum) => void;
    onBulkAddToProject?: (partIds: string[]) => void;
}
