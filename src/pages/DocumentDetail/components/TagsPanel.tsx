import React from "react";
import {Link} from "react-router-dom";
import {Tag, X} from "lucide-react";
import type {Database} from "../../../lib/database.types";

type Part = Database["public"]["Tables"]["parts"]["Row"];

export type TagsPanelProps = {
    t: any;
    lang: string;
    canUseTags: boolean;
    selectedPart: Part | undefined;
    tags: { id: string; label: string }[];
    tagsLoading: boolean;
    tagsError: string | null;
    newTag: string;
    setNewTag: React.Dispatch<React.SetStateAction<string>>;
    addTag: (label: string) => Promise<void>;
    removeTag: (tagId: string) => Promise<void>;
};

export const TagsPanel = React.memo(function TagsPanel(props: TagsPanelProps) {
    const {
        t,
        lang,
        canUseTags,
        selectedPart,
        tags,
        tagsLoading,
        tagsError,
        newTag,
        setNewTag,
        addTag,
        removeTag,
    } = props;

    if (!selectedPart) return null;

    return (
        <div className="pt-4">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-500" strokeWidth={1.5}/>
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            {t("documents.detail.tags.title")}
          </span>
                </div>

                {!canUseTags && (
                    <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-50 text-amber-700 border border-amber-200">
            {t("documents.detail.upgrade")}
          </span>
                )}
            </div>

            {!canUseTags ? (
                <div
                    className="text-xs text-gray-600 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2">
                    {t("documents.detail.tags.lockedPrefix")}{" "}
                    <Link to={`/${lang}/app/settings/billing`} className="text-blue-600 hover:underline font-medium">
                        {t("documents.detail.billing")}
                    </Link>{" "}
                    {t("documents.detail.tags.lockedSuffix")}
                </div>
            ) : (
                <div className="border border-gray-200 rounded-lg px-3 py-2 bg-slate-50">
                    {tagsError && <div className="mb-2 text-[11px] text-red-600">{tagsError}</div>}

                    <div className="flex flex-wrap gap-1 mb-2 min-h-[1.5rem]">
                        {tagsLoading ? (
                            <span className="text-xs text-gray-500">{t("documents.detail.tags.loading")}</span>
                        ) : tags.length === 0 ? (
                            <span className="text-xs text-gray-400">{t("documents.detail.tags.empty")}</span>
                        ) : (
                            tags.map((tItem) => (
                                <span
                                    key={tItem.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-gray-200 text-xs text-gray-800"
                                >
                  {tItem.label}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tItem.id)}
                                        className="ml-0.5 p-0.5 hover:bg-gray-100 rounded-full"
                                    >
                    <X className="w-3 h-3 text-gray-500" strokeWidth={1.5}/>
                  </button>
                </span>
                            ))
                        )}
                    </div>

                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const trimmed = newTag.trim();
                            if (!trimmed) return;
                            await addTag(trimmed);
                            setNewTag("");
                        }}
                        className="flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder={t("documents.detail.tags.placeholder")}
                            className="flex-1 text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                        <button
                            type="submit"
                            disabled={!newTag.trim()}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-500 transition-colors"
                        >
                            {t("documents.detail.tags.add")}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
});
