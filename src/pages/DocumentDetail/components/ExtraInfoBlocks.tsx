import React from "react";

export const ExtraInfoBlocks: React.FC<{
    t: any;
    selectedPartReport: any | undefined;
}> = ({t, selectedPartReport}) => {
    if (!selectedPartReport) return null;

    const drawingInfo = selectedPartReport.drawing_info;
    const overview = selectedPartReport.overview;

    if (!drawingInfo && !overview) return null;

    return (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
            {drawingInfo && (
                <div className="p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {t("documents.detail.drawingInfo.title")}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {drawingInfo.drawing_number && (
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {t("documents.detail.drawingInfo.drawingNumber")}
                                </dt>
                                <dd className="text-sm text-gray-900 break-words">{drawingInfo.drawing_number}</dd>
                            </div>
                        )}
                        {drawingInfo.drawing_title && (
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {t("documents.detail.drawingInfo.titleLabel")}
                                </dt>
                                <dd className="text-sm text-gray-900 break-words">{drawingInfo.drawing_title}</dd>
                            </div>
                        )}
                        {drawingInfo.part_number && (
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {t("documents.detail.drawingInfo.partNumber")}
                                </dt>
                                <dd className="text-sm text-gray-900 break-words">{drawingInfo.part_number}</dd>
                            </div>
                        )}
                        {drawingInfo.revision && (
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {t("documents.detail.drawingInfo.revision")}
                                </dt>
                                <dd className="text-sm text-gray-900 flex items-center gap-2 flex-wrap">
                                    <span>{drawingInfo.revision}</span>
                                    {drawingInfo.revision_change_text && (
                                        <span className="text-xs text-amber-700 font-medium">
                      ({drawingInfo.revision_change_text})
                    </span>
                                    )}
                                </dd>
                            </div>
                        )}
                        {drawingInfo.date && (
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {t("documents.detail.drawingInfo.date")}
                                </dt>
                                <dd className="text-sm text-gray-900">{drawingInfo.date}</dd>
                            </div>
                        )}
                        {drawingInfo.revision_date && (
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {t("documents.detail.drawingInfo.revisionDate")}
                                </dt>
                                <dd className="text-sm text-gray-900">{drawingInfo.revision_date}</dd>
                            </div>
                        )}
                        {drawingInfo.scale && (
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {t("documents.detail.drawingInfo.scale")}
                                </dt>
                                <dd className="text-sm text-gray-900">{drawingInfo.scale}</dd>
                            </div>
                        )}
                        {drawingInfo.base_unit && (
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {t("documents.detail.drawingInfo.units")}
                                </dt>
                                <dd className="text-sm text-gray-900">{drawingInfo.base_unit}</dd>
                            </div>
                        )}
                        {drawingInfo.author && (
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {t("documents.detail.drawingInfo.author")}
                                </dt>
                                <dd className="text-sm text-gray-900 break-words">{drawingInfo.author}</dd>
                            </div>
                        )}
                        {drawingInfo.checker && (
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {t("documents.detail.drawingInfo.checker")}
                                </dt>
                                <dd className="text-sm text-gray-900 break-words">{drawingInfo.checker}</dd>
                            </div>
                        )}
                        {drawingInfo.approver && (
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {t("documents.detail.drawingInfo.approver")}
                                </dt>
                                <dd className="text-sm text-gray-900 break-words">{drawingInfo.approver}</dd>
                            </div>
                        )}
                        {drawingInfo.sheet_info && (
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {t("documents.detail.drawingInfo.sheet")}
                                </dt>
                                <dd className="text-sm text-gray-900">
                                    {drawingInfo.sheet_info.sheet} {t("documents.detail.drawingInfo.of")}{" "}
                                    {drawingInfo.sheet_info.total_sheets}
                                </dd>
                            </div>
                        )}
                        {drawingInfo.projection_type && (
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {t("documents.detail.drawingInfo.projectionType")}
                                </dt>
                                <dd className="text-sm text-gray-900 capitalize">{drawingInfo.projection_type}</dd>
                            </div>
                        )}
                        {drawingInfo.company_name && (
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {t("documents.detail.drawingInfo.company")}
                                </dt>
                                <dd className="text-sm text-gray-900 break-words">{drawingInfo.company_name}</dd>
                            </div>
                        )}
                        {drawingInfo.project_name && (
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {t("documents.detail.drawingInfo.project")}
                                </dt>
                                <dd className="text-sm text-gray-900 break-words">{drawingInfo.project_name}</dd>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {overview && (overview.material || overview.blank_dimensions) && (
                <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {overview.material && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("documents.detail.material.title")}</h3>
                                <div className="space-y-3">
                                    {overview.material.value && (
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                {t("documents.detail.material.labels.material")}
                                            </dt>
                                            <dd className="text-sm text-gray-900 break-words">{overview.material.value}</dd>
                                        </div>
                                    )}
                                    {overview.material.text && (
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                {t("documents.detail.material.labels.note")}
                                            </dt>
                                            <dd className="text-sm text-gray-900 break-words">{overview.material.text}</dd>
                                        </div>
                                    )}
                                    {overview.weight && overview.weight.value != null && (
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                {t("documents.detail.material.labels.weight")}
                                            </dt>
                                            <dd className="text-sm text-gray-900">
                                                {overview.weight.value} {overview.weight.unit}
                                            </dd>
                                        </div>
                                    )}
                                    {overview.material.confidence !== undefined && overview.material.confidence !== null && (
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                {t("documents.detail.material.labels.confidence")}
                                            </dt>
                                            <dd className="text-sm text-gray-900">{(overview.material.confidence * 100).toFixed(0)}%</dd>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {overview.blank_dimensions && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    {t("documents.detail.blankDimensions.title")}
                                </h3>
                                <div className="space-y-3">
                                    {overview.blank_dimensions.text_norm && (
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                {t("documents.detail.blankDimensions.labels.dimensions")}
                                            </dt>
                                            <dd className="text-sm text-gray-900 break-words">{overview.blank_dimensions.text_norm}</dd>
                                        </div>
                                    )}
                                    {overview.blank_dimensions.text && (
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                {t("documents.detail.blankDimensions.labels.note")}
                                            </dt>
                                            <dd className="text-sm text-gray-900 break-words">{overview.blank_dimensions.text}</dd>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-3 gap-2">
                                        {overview.blank_dimensions.unit && (
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                    {t("documents.detail.blankDimensions.labels.unit")}
                                                </dt>
                                                <dd className="text-sm text-gray-900">{overview.blank_dimensions.unit}</dd>
                                            </div>
                                        )}
                                        {overview.blank_dimensions.source && (
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                    {t("documents.detail.blankDimensions.labels.source")}
                                                </dt>
                                                <dd className="text-sm text-gray-900 break-words">{overview.blank_dimensions.source}</dd>
                                            </div>
                                        )}
                                        {overview.blank_dimensions.confidence !== undefined &&
                                            overview.blank_dimensions.confidence !== null && (
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                        {t("documents.detail.blankDimensions.labels.confidence")}
                                                    </dt>
                                                    <dd className="text-sm text-gray-900">
                                                        {(overview.blank_dimensions.confidence * 100).toFixed(0)}%
                                                    </dd>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
