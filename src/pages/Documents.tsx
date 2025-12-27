import React, {useRef, useState} from "react";
import {AlertCircle, Upload} from "lucide-react";
import {useTranslation} from "react-i18next";
import {useAuth} from "../contexts/AuthContext";
import {useParts} from "../hooks/useParts";
import {useDocumentUpload} from "../hooks/useDocumentUpload";
import {useOrgBilling} from "../hooks/useOrgBilling";
import {useOrgUsage} from "../hooks/useOrgUsage";
import {getUsageUiInfo, isInactiveStatus} from "../utils/billing";
import {formatTierLabel} from "../utils/tiers";
import PartsManager from "../components/documents/PartsManager";

const Documents: React.FC = () => {
    const {currentOrg, user} = useAuth();
    const {t} = useTranslation();
    const {parts, setParts, loading, hasMore, loadMore} = useParts(currentOrg, 50);
    const {uploading, uploadProgress, uploadError, uploadFiles} = useDocumentUpload(currentOrg, user);
    const {billing} = useOrgBilling();
    const {usage} = useOrgUsage(currentOrg?.org_id);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {jobsUsed, maxJobs, isOverLimit, periodLabel} =
        getUsageUiInfo(billing ?? null, usage ?? null);
    const uploadsBlocked = !currentOrg || isInactiveStatus(billing?.status) || isOverLimit;

    return (
        <div className="min-h-screen relative bg-gradient-to-br from-slate-50 via-white to-slate-50"
             onDragOver={(e) => {
                 e.preventDefault();
                 setIsDragging(true);
             }}
             onDragLeave={() => setIsDragging(false)}
             onDrop={async (e) => {
                 e.preventDefault();
                 setIsDragging(false);
                 if (e.dataTransfer.files.length && !uploadsBlocked) await uploadFiles(Array.from(e.dataTransfer.files));
             }}>

            {isDragging && (
                <div
                    className="pointer-events-none fixed inset-0 flex items-center justify-center z-50 bg-blue-600/5 backdrop-blur-sm">
                    <div
                        className="bg-blue-600 text-white px-8 py-4 rounded-xl shadow-xl font-semibold flex items-center gap-3">
                        <Upload className="w-5 h-5"/> {t("documents.dropFilesToUpload")}
                    </div>
                </div>
            )}

            <div className="p-6 mx-auto" style={{maxWidth: "1800px"}}>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">{t("documents.title")}</h1>
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading || uploadsBlocked}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-all active:scale-[0.98] ${uploadsBlocked ? "bg-gray-300 text-gray-600" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
                        <Upload className="w-4 h-4"/> <span
                        className="text-sm font-medium">{uploading ? t('common.uploading') : t('documents.uploadDocuments')}</span>
                    </button>
                </div>

                <input ref={fileInputRef} type="file" multiple accept=".pdf,.dwg,.dxf" onChange={async (e) => {
                    if (e.target.files?.length) await uploadFiles(Array.from(e.target.files));
                }} className="hidden"/>

                {(uploadError || isOverLimit) && (
                    <div
                        className={`mb-4 p-4 rounded-lg border flex items-start gap-3 text-xs ${uploadError ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
                        <AlertCircle className="w-5 h-5 flex-shrink-0"/>
                        <div>{uploadError || `${t("documents.reachedLimit")} ${billing?.tier ? formatTierLabel(billing.tier.code) : ""} ${t("billing.plan")}. ${t("billingSettings.usageInCurrentPeriod")} (${periodLabel}): ${jobsUsed}/${maxJobs}`}</div>
                    </div>
                )}

                <PartsManager
                    parts={parts}
                    setParts={setParts}
                    loading={loading && parts.length === 0}
                    mode="all-documents"
                    uploading={uploading}
                    uploadProgress={uploadProgress}
                    onUploadClick={() => fileInputRef.current?.click()}
                    canUseProjects={!!billing?.tier?.can_use_projects}
                    canUseFavorite={!!billing?.tier?.can_set_favourite}
                    canSetStatus={!!billing?.tier?.can_set_status}
                    canSetPriority={!!billing?.tier?.can_set_priority}
                />

                {hasMore && !loading && (
                    <div className="flex justify-center mt-6">
                        <button onClick={loadMore}
                                className="px-6 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors">{t("common.loadMore")}</button>
                    </div>
                )}
            </div>
        </div>
    );
};
export default Documents;