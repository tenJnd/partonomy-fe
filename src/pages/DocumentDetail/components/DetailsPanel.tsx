import React from "react";
import {ChevronDown, ChevronUp, Loader} from "lucide-react";
import {Link} from "react-router-dom";
import type {Database} from "../../../lib/database.types";
import {TagsPanel} from "./TagsPanel";

type Part = Database["public"]["Tables"]["parts"]["Row"];

export const DetailsPanel: React.FC<{
    t: any;
    lang: string;

    // layout
    mobileMainTab: "preview" | "details";

    // tabs
    activeReportTab: "report" | "bom" | "revisions" | "comments";
    setActiveReportTab: React.Dispatch<
        React.SetStateAction<"report" | "bom" | "revisions" | "comments">
    >;

    // permissions
    canComment: boolean;
    canUseTags: boolean;

    // data
    selectedPart: Part | undefined;
    selectedPartReport: any | undefined;

    // expanded
    expandedSections: Record<string, boolean>;
    toggleSection: (section: string) => void;

    // comments
    comments: any[];
    commentsLoading: boolean;
    commentsError: string | null;
    newComment: string;
    setNewComment: React.Dispatch<React.SetStateAction<string>>;
    addComment: (body: string) => Promise<void>;

    // tags
    tags: { id: string; label: string }[];
    tagsLoading: boolean;
    tagsError: string | null;
    newTag: string;
    setNewTag: React.Dispatch<React.SetStateAction<string>>;
    addTag: (label: string) => Promise<void>;
    removeTag: (tagId: string) => Promise<void>;
}> = (props) => {
    const {
        t,
        lang,
        mobileMainTab,
        activeReportTab,
        setActiveReportTab,
        canComment,
        canUseTags,
        selectedPart,
        selectedPartReport,
        expandedSections,
        toggleSection,
        comments,
        commentsLoading,
        commentsError,
        newComment,
        setNewComment,
        addComment,
        tags,
        tagsLoading,
        tagsError,
        newTag,
        setNewTag,
        addTag,
        removeTag,
    } = props;

    return (
        <div
            className={`bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6 xl:col-span-2 min-h-0 ${
                mobileMainTab === "preview" ? "hidden xl:block" : ""
            }`}
        >
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-4">
                <div className="flex items-center gap-6 -mb-px overflow-x-auto">
                    <button
                        onClick={() => setActiveReportTab("report")}
                        className={`px-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
                            activeReportTab === "report"
                                ? "border-blue-600 text-blue-700"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        {t("documents.detail.tabs.report")}
                    </button>

                    <button
                        onClick={() => setActiveReportTab("bom")}
                        className={`px-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
                            activeReportTab === "bom"
                                ? "border-blue-600 text-blue-700"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        {t("documents.detail.tabs.bom")}
                    </button>

                    <button
                        onClick={() => setActiveReportTab("revisions")}
                        className={`px-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
                            activeReportTab === "revisions"
                                ? "border-blue-600 text-blue-700"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        {t("documents.detail.tabs.revisions")}
                    </button>

                    <button
                        onClick={() => setActiveReportTab("comments")}
                        className={`px-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
                            activeReportTab === "comments"
                                ? canComment
                                    ? "border-blue-600 text-blue-700"
                                    : "border-amber-500 text-amber-700"
                                : canComment
                                    ? "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    : "border-transparent text-gray-400 hover:text-gray-500 hover:border-gray-200"
                        }`}
                    >
                        {t("documents.detail.tabs.comments")}
                    </button>
                </div>
            </div>

            {/* Content */}
            {selectedPart && selectedPartReport ? (
                <ReportContent
                    t={t}
                    lang={lang}
                    canComment={canComment}
                    canUseTags={canUseTags}
                    selectedPart={selectedPart}
                    reportJson={selectedPartReport}
                    activeReportTab={activeReportTab}
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                    comments={comments}
                    commentsLoading={commentsLoading}
                    commentsError={commentsError}
                    newComment={newComment}
                    setNewComment={setNewComment}
                    addComment={addComment}
                    tags={tags}
                    tagsLoading={tagsLoading}
                    tagsError={tagsError}
                    newTag={newTag}
                    setNewTag={setNewTag}
                    addTag={addTag}
                    removeTag={removeTag}
                />
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <p>{t("documents.detail.noAnalysisData")}</p>

                    <TagsPanel
                        t={t}
                        lang={lang}
                        canUseTags={canUseTags}
                        selectedPart={selectedPart}
                        tags={tags}
                        tagsLoading={tagsLoading}
                        tagsError={tagsError}
                        newTag={newTag}
                        setNewTag={setNewTag}
                        addTag={addTag}
                        removeTag={removeTag}
                    />
                </div>
            )}
        </div>
    );
};

const ReportContent: React.FC<{
    t: any;
    lang: string;
    canComment: boolean;
    canUseTags: boolean;
    selectedPart: Part;
    reportJson: any;
    activeReportTab: "report" | "bom" | "revisions" | "comments";
    expandedSections: Record<string, boolean>;
    toggleSection: (section: string) => void;

    comments: any[];
    commentsLoading: boolean;
    commentsError: string | null;
    newComment: string;
    setNewComment: React.Dispatch<React.SetStateAction<string>>;
    addComment: (body: string) => Promise<void>;

    tags: { id: string; label: string }[];
    tagsLoading: boolean;
    tagsError: string | null;
    newTag: string;
    setNewTag: React.Dispatch<React.SetStateAction<string>>;
    addTag: (label: string) => Promise<void>;
    removeTag: (tagId: string) => Promise<void>;
}> = ({
          t,
          lang,
          canComment,
          canUseTags,
          selectedPart,
          reportJson,
          activeReportTab,
          expandedSections,
          toggleSection,
          comments,
          commentsLoading,
          commentsError,
          newComment,
          setNewComment,
          addComment,
          tags,
          tagsLoading,
          tagsError,
          newTag,
          setNewTag,
          addTag,
          removeTag,
      }) => {
    const overview = reportJson.overview;
    const assessment = reportJson.assessment;
    const costDrivers = reportJson.cost_drivers;
    const criticalPoints = reportJson.critical_points;
    const processHints = reportJson.process_hints;
    const internalNotes = reportJson.internal_notes;

    const bom = reportJson.bill_of_materials as any[] | undefined;
    const revisionHistory = reportJson.revision_history as any[] | undefined;

    if (activeReportTab === "bom") {
        return (
            <div className="space-y-4">
                {bom && bom.length > 0 ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-xs">
                                <thead className="bg-slate-50">
                                <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
                                    <th className="px-3 py-2 border-b border-gray-200">
                                        {t("documents.detail.bom.headers.partNumber")}
                                    </th>
                                    <th className="px-3 py-2 border-b border-gray-200">
                                        {t("documents.detail.bom.headers.qty")}
                                    </th>
                                    <th className="px-3 py-2 border-b border-gray-200">
                                        {t("documents.detail.bom.headers.unit")}
                                    </th>
                                    <th className="px-3 py-2 border-b border-gray-200">
                                        {t("documents.detail.bom.headers.material")}
                                    </th>
                                    <th className="px-3 py-2 border-b border-gray-200">
                                        {t("documents.detail.bom.headers.weight")}
                                    </th>
                                    <th className="px-3 py-2 border-b border-gray-200">
                                        {t("documents.detail.bom.headers.std")}
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {bom.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/60">
                                        <td className="px-3 py-2 text-gray-900 whitespace-nowrap">{row.part_number || "-"}</td>
                                        <td className="px-3 py-2 text-gray-900">{row.quantity ?? "-"}</td>
                                        <td className="px-3 py-2 text-gray-700">{row.unit || "-"}</td>
                                        <td className="px-3 py-2 text-gray-700">{row.material || "-"}</td>
                                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                            {row.weight != null ? row.weight : "-"} {row.weight_unit || ""}
                                        </td>
                                        <td className="px-3 py-2 text-gray-700">{row.std || "-"}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-3 py-2 text-[11px] text-gray-500 border-t border-gray-100">
                            {t("documents.detail.bom.parsedFromDrawing")}
                        </div>
                    </div>
                ) : (
                    <div
                        className="text-center py-8 text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg">
                        {t("documents.detail.bom.noData")}
                    </div>
                )}
            </div>
        );
    }

    if (activeReportTab === "revisions") {
        return (
            <div className="space-y-4">
                {revisionHistory && revisionHistory.length > 0 ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-xs">
                                <thead className="bg-slate-50">
                                <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
                                    <th className="px-3 py-2 border-b border-gray-200">{t("documents.detail.revisions.headers.date")}</th>
                                    <th className="px-3 py-2 border-b border-gray-200">{t("documents.detail.revisions.headers.author")}</th>
                                    <th className="px-3 py-2 border-b border-gray-200">{t("documents.detail.revisions.headers.rev")}</th>
                                    <th className="px-3 py-2 border-b border-gray-200">{t("documents.detail.revisions.headers.description")}</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {revisionHistory.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/60 align-top">
                                        <td className="px-3 py-2 text-gray-900 whitespace-nowrap">{row.date || "-"}</td>
                                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{row.author || "-"}</td>
                                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{row.rev_number ?? "-"}</td>
                                        <td className="px-3 py-2 text-gray-900">{row.description || "-"}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-3 py-2 text-[11px] text-gray-500 border-t border-gray-100">
                            {t("documents.detail.revisions.parsedFromDrawing")}
                        </div>
                    </div>
                ) : (
                    <div
                        className="text-center py-8 text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg">
                        {t("documents.detail.revisions.noData")}
                    </div>
                )}
            </div>
        );
    }

    if (activeReportTab === "comments") {
        if (!canComment) {
            return (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">{t("documents.detail.comments.title")}</h3>
                        <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-50 text-amber-700 border border-amber-200">
              {t("documents.detail.upgrade")}
            </span>
                    </div>

                    <div
                        className="text-xs text-gray-600 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-3">
                        {t("documents.detail.comments.lockedPrefix")}{" "}
                        <Link to={`/${lang}/app/settings/billing`}
                              className="text-blue-600 hover:underline font-medium">
                            {t("documents.detail.billing")}
                        </Link>{" "}
                        {t("documents.detail.comments.lockedSuffix")}
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-4 min-h-0">
                {commentsError && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                        {commentsError}
                    </div>
                )}

                <div
                    className="border border-gray-200 rounded-lg bg-white overflow-auto min-h-0 max-h-[40vh] sm:max-h-[320px]">
                    {commentsLoading ? (
                        <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
                            <Loader className="w-4 h-4 mr-2 animate-spin" strokeWidth={1.5}/>
                            {t("documents.detail.comments.loading")}
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
                            {t("documents.detail.comments.empty")}
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {comments.map((c) => (
                                <li key={c.id} className="px-4 py-3 text-sm hover:bg-slate-50/70">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-gray-900">
                          {c.author_name || t("documents.detail.comments.userFallback")}
                        </span>
                                                {c.created_at && (
                                                    <span className="text-[11px] text-gray-500">
                            {new Date(c.created_at).toLocaleString()}
                          </span>
                                                )}
                                            </div>
                                            <p className="text-gray-800 whitespace-pre-line break-words">{c.body}</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (!newComment.trim()) return;
                        await addComment(newComment);
                        setNewComment("");
                    }}
                    className="space-y-2"
                >
                    <label
                        className="text-xs font-medium text-gray-700">{t("documents.detail.comments.addLabel")}</label>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        placeholder={t("documents.detail.comments.placeholder")}
                    />
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-500 transition-colors"
                        >
                            {t("documents.detail.comments.addButton")}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // Report default
    return (
        <div className="space-y-4">
            {overview?.quick_summary && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">{t("documents.detail.report.summary")}</h3>
                    <p className="text-sm text-blue-800 leading-relaxed">{overview.quick_summary}</p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                {assessment?.overall_complexity && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                            {t("documents.detail.report.complexity")}
                        </dt>
                        <dd
                            className={`inline-flex px-2.5 py-1 rounded-md border text-xs font-semibold ${
                                assessment.overall_complexity === "EXTREME" || assessment.overall_complexity === "HIGH"
                                    ? "bg-rose-50 text-rose-800 border-rose-300"
                                    : assessment.overall_complexity === "MEDIUM"
                                        ? "bg-amber-50 text-amber-800 border-amber-300"
                                        : assessment.overall_complexity === "LOW"
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                            : "bg-gray-50 text-gray-700 border-gray-300"
                            }`}
                        >
                            {assessment.overall_complexity}
                        </dd>
                    </div>
                )}

                {assessment?.manufacturing_risk_level && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                            {t("documents.detail.report.riskLevel")}
                        </dt>
                        <dd
                            className={`inline-flex px-2.5 py-1 rounded-md border text-xs font-semibold ${
                                assessment.manufacturing_risk_level === "EXTREME" || assessment.manufacturing_risk_level === "HIGH"
                                    ? "bg-rose-50 text-rose-800 border-rose-300"
                                    : assessment.manufacturing_risk_level === "MEDIUM"
                                        ? "bg-amber-50 text-amber-800 border-amber-300"
                                        : assessment.manufacturing_risk_level === "LOW"
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                            : "bg-gray-50 text-gray-700 border-gray-300"
                            }`}
                        >
                            {assessment.manufacturing_risk_level}
                        </dd>
                    </div>
                )}

                {overview?.highlight_summary && Array.isArray(overview.highlight_summary) && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 col-span-2">
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                            {t("documents.detail.report.highlights")}
                        </dt>
                        <dd className="text-xs text-gray-900">
                            <ul className="list-disc list-inside space-y-1">
                                {overview.highlight_summary.map((item: string, idx: number) => (
                                    <li key={idx}>{item}</li>
                                ))}
                            </ul>
                        </dd>
                    </div>
                )}

                {assessment?.shop_alignment && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 col-span-2">
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                            {t("documents.detail.report.shopAlignment")}
                        </dt>
                        <dd className="text-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-gray-700">{t("documents.detail.report.fit")}:</span>
                                <span
                                    className={`inline-flex px-2.5 py-1 rounded-md border text-xs font-medium ${
                                        assessment.shop_alignment.fit_level === "GOOD"
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                            : assessment.shop_alignment.fit_level === "PARTIAL"
                                                ? "bg-blue-50 text-blue-800 border-blue-300"
                                                : assessment.shop_alignment.fit_level === "COOPERATION"
                                                    ? "bg-purple-50 text-purple-800 border-purple-300"
                                                    : assessment.shop_alignment.fit_level === "LOW"
                                                        ? "bg-amber-50 text-amber-800 border-amber-300"
                                                        : "bg-gray-50 text-gray-600 border-gray-300"
                                    }`}
                                >
                  {assessment.shop_alignment.fit_level}
                </span>
                            </div>

                            <div className="text-xs text-gray-900">{assessment.shop_alignment.fit_summary}</div>

                            {assessment?.shop_alignment?.fit_level === "UNKNOWN" && (
                                <div
                                    className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                                    {t("documents.detail.report.fillOrgProfileNote")}
                                </div>
                            )}
                        </dd>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                {costDrivers && Array.isArray(costDrivers) && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection("cost")}
                            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                        >
              <span className="text-sm font-semibold text-gray-900">
                {t("documents.detail.sections.costDrivers")}
                  <span className="ml-1 italic text-[11px] text-gray-500">
                  {t("documents.detail.sections.quoteCentric")}
                </span>
              </span>
                            {expandedSections["cost"] ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                            )}
                        </button>

                        {expandedSections["cost"] && (
                            <div className="p-4 bg-white space-y-3">
                                {costDrivers.map((driver: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className={`border-l-2 pl-3 ${
                                            driver.impact === "EXTREME"
                                                ? "border-red-400"
                                                : driver.impact === "HIGH"
                                                    ? "border-orange-400"
                                                    : driver.impact === "MEDIUM"
                                                        ? "border-yellow-400"
                                                        : "border-green-400"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-semibold text-gray-900">{driver.factor}</span>
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded ${
                                                    driver.impact === "EXTREME"
                                                        ? "bg-red-100 text-red-800"
                                                        : driver.impact === "HIGH"
                                                            ? "bg-orange-100 text-yellow-800"
                                                            : driver.impact === "MEDIUM"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-green-100 text-green-800"
                                                }`}
                                            >
                        {driver.impact}
                      </span>
                                        </div>
                                        <p className="text-xs text-gray-600">{driver.details}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {processHints && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection("processing")}
                            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                        >
              <span className="text-sm font-semibold text-gray-900">
                {t("documents.detail.sections.processingHints")}
              </span>
                            {expandedSections["processing"] ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                            )}
                        </button>

                        {expandedSections["processing"] && (
                            <div className="p-4 bg-white space-y-3">
                                {processHints.likely_routing_steps && (
                                    <div>
                                        <dt className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                            {t("documents.detail.processing.routingSteps")}
                                        </dt>
                                        <div className="flex flex-wrap gap-2">
                                            {processHints.likely_routing_steps.map((step: string, idx: number) => (
                                                <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {step}
                        </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {processHints.machine_capability_hint && (
                                    <div>
                                        <dt className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                            {t("documents.detail.processing.machineCapability")}
                                        </dt>
                                        <ul className="space-y-1">
                                            {processHints.machine_capability_hint.map((item: string, idx: number) => (
                                                <li key={idx} className="text-xs text-gray-900">
                                                    • {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {processHints.inspection_focus && (
                                    <div>
                                        <dt className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                            {t("documents.detail.processing.inspectionFocus")}
                                        </dt>
                                        <ul className="space-y-1">
                                            {processHints.inspection_focus.map((item: string, idx: number) => (
                                                <li key={idx} className="text-xs text-gray-900">
                                                    • {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {criticalPoints && Array.isArray(criticalPoints) && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection("critical")}
                            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                        >
              <span className="text-sm font-semibold text-gray-900">
                {t("documents.detail.sections.criticalPoints")}
                  <span className="ml-1 italic text-[11px] text-gray-500">
                  {t("documents.detail.sections.productionCentric")}
                </span>
              </span>
                            {expandedSections["critical"] ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                            )}
                        </button>

                        {expandedSections["critical"] && (
                            <div className="p-4 bg-white space-y-3">
                                {criticalPoints.map((point: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className={`border-l-2 pl-3 ${
                                            point.importance === "EXTREME"
                                                ? "border-red-400"
                                                : point.importance === "HIGH"
                                                    ? "border-orange-400"
                                                    : point.importance === "MEDIUM"
                                                        ? "border-yellow-400"
                                                        : "border-green-400"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900 capitalize">
                        {String(point.type || "").replace(/_/g, " ")}
                      </span>
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded ${
                                                    point.importance === "EXTREME"
                                                        ? "bg-red-100 text-red-800"
                                                        : point.importance === "HIGH"
                                                            ? "bg-orange-100 text-yellow-800"
                                                            : point.importance === "MEDIUM"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-green-100 text-green-800"
                                                }`}
                                            >
                        {point.importance}
                      </span>
                                        </div>
                                        <p className="text-xs text-gray-600">{point.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {(assessment?.key_risks || assessment?.key_opportunities) && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection("risks")}
                            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                        >
              <span className="text-sm font-semibold text-gray-900">
                {t("documents.detail.sections.keyRisksOpportunities")}
              </span>
                            {expandedSections["risks"] ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                            )}
                        </button>

                        {expandedSections["risks"] && (
                            <div className="p-4 bg-white space-y-4">
                                {assessment.key_risks && Array.isArray(assessment.key_risks) && (
                                    <div>
                                        <dt className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">
                                            {t("documents.detail.sections.risks")}
                                        </dt>
                                        <ul className="space-y-2">
                                            {assessment.key_risks.map((risk: string, idx: number) => (
                                                <li
                                                    key={idx}
                                                    className="text-sm text-gray-900 pl-4 border-l-2 border-red-300"
                                                >
                                                    {risk}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {assessment.key_opportunities && Array.isArray(assessment.key_opportunities) && (
                                    <div>
                                        <dt className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">
                                            {t("documents.detail.sections.opportunities")}
                                        </dt>
                                        <ul className="space-y-2">
                                            {assessment.key_opportunities.map((opp: string, idx: number) => (
                                                <li
                                                    key={idx}
                                                    className="text-sm text-gray-900 pl-4 border-l-2 border-green-300"
                                                >
                                                    {opp}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {internalNotes && Array.isArray(internalNotes) && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection("notes")}
                            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                        >
              <span className="text-sm font-semibold text-gray-900">
                {t("documents.detail.sections.internalNotes")}
              </span>
                            {expandedSections["notes"] ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                            )}
                        </button>

                        {expandedSections["notes"] && (
                            <div className="p-4 bg-white">
                                <ul className="space-y-2">
                                    {internalNotes.map((note: string, idx: number) => (
                                        <li key={idx} className="text-sm text-gray-700 pl-4 border-l-2 border-gray-300">
                                            {note}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Tags */}
            <TagsPanel
                t={t}
                lang={lang}
                canUseTags={canUseTags}
                selectedPart={selectedPart}
                tags={tags}
                tagsLoading={tagsLoading}
                tagsError={tagsError}
                newTag={newTag}
                setNewTag={setNewTag}
                addTag={addTag}
                removeTag={removeTag}
            />
        </div>
    );
};
