import React, {useState} from "react";
import {useTranslation} from "react-i18next";
import {useProjects} from "../../hooks/useProjects";
import {supabase} from "../../lib/supabase";
import {useAuth} from "../../contexts/AuthContext";
import {PartWithDocument} from "../../hooks/useParts";
import {AlertCircle, X} from "lucide-react";

interface AddToProjectModalProps {
    open: boolean;
    onClose: () => void;
    part: PartWithDocument | null;
    bulkPartIds: string[] | null;
}

const AddToProjectModal: React.FC<AddToProjectModalProps> = ({open, onClose, part, bulkPartIds}) => {
    const {t} = useTranslation();
    const {projects, loading: projectsLoading} = useProjects();
    const {currentOrg, user} = useAuth();
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!open) return null;

    const handleConfirm = async () => {
        if (!selectedProjectId || !currentOrg || !user) return;
        setLoading(true);
        setError(null);

        const idsToHandle = bulkPartIds || (part ? [part.id] : []);

        try {
            const rows = idsToHandle.map(id => ({
                org_id: currentOrg.org_id,
                project_id: selectedProjectId,
                part_id: id,
                added_by_user_id: user.id
            }));

            // Změna z .upsert() na .insert()
            const {error: insertError} = await supabase
                .from("project_parts")
                .insert(rows);

            if (insertError) {
                // Pokud už díl v projektu je (chyba 23505), můžeme to ignorovat nebo nahlásit
                if (insertError.code === '23505') {
                    setError(t("projects.detail.errors.alreadyInProject") || "Some parts are already in this project.");
                    setLoading(false);
                    return;
                }
                throw insertError;
            }

            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5"/>
                </button>

                <h2 className="text-lg font-semibold mb-4">{t("documents.addPartToProject")}</h2>

                {error && (
                    <div
                        className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0"/> {error}
                    </div>
                )}

                <div className="space-y-4">
                    <label className="block text-xs font-medium text-gray-700">{t("common.project")}</label>
                    <select
                        value={selectedProjectId}
                        onChange={e => setSelectedProjectId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
                        disabled={projectsLoading || loading}
                    >
                        <option value="">{t("common.selectProject")}</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={onClose}
                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">{t("common.cancel")}</button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedProjectId || loading}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? t("common.adding") : t("common.addToProject")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddToProjectModal;