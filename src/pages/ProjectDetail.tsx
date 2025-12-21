// src/pages/ProjectDetail.tsx
import React, {useEffect, useMemo, useState} from "react";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {ArrowLeft} from "lucide-react";
import {useAuth} from "../contexts/AuthContext";
import {supabase} from "../lib/supabase";
import type {PartWithDocument} from "../hooks/useParts";
import {useParts} from "../hooks/useParts";
import {useOrgBilling} from "../hooks/useOrgBilling";
import {useLang} from "../hooks/useLang";
import {useTranslation} from "react-i18next";
import PartsManager from "../components/documents/PartsManager";

const ProjectDetail: React.FC = () => {
    const {projectId} = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const lang = useLang();
    const {t} = useTranslation();
    const {currentOrg} = useAuth();
    const {billing} = useOrgBilling();
    const {parts, setParts, loading} = useParts(currentOrg, 200);

    const [project, setProject] = useState<any>(null);
    const [projectPartIds, setProjectPartIds] = useState<string[]>([]);

    // back url (z listu včetně query filtrů)
    const backTo =
        (location.state as any)?.from ?? `/${lang}/app/projects`;

    useEffect(() => {
        if (!currentOrg || !projectId) return;

        supabase
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .single()
            .then(({data}) => setProject(data));

        supabase
            .from("project_parts")
            .select("part_id")
            .eq("project_id", projectId)
            .then(({data}) => setProjectPartIds(data?.map(r => r.part_id) || []));
    }, [currentOrg, projectId]);

    const handleRemoveFromProject = async (part: PartWithDocument) => {
        const {error} = await supabase
            .from("project_parts")
            .delete()
            .eq("project_id", projectId)
            .eq("part_id", part.id);

        if (!error) {
            setProjectPartIds(prev => prev.filter(id => id !== part.id));
        }
    };

    const projectParts = useMemo(
        () => parts.filter(p => projectPartIds.includes(p.id)),
        [parts, projectPartIds]
    );

    return (
        <div className="p-6 mx-auto" style={{maxWidth: "1800px"}}>
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(backTo)}
                    className="p-2 border rounded-md hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4"/>
                </button>

                <h1 className="text-xl font-bold text-gray-900">
                    {project?.name || t("projects.detail.projectFallback")}
                </h1>
            </div>

            <PartsManager
                parts={projectParts}
                setParts={setParts}
                loading={loading}
                mode="project-detail"
                canUseProjects={!!billing?.tier?.can_use_projects}
                canUseFavorite={!!billing?.tier?.can_set_favourite}
                canSetStatus={!!billing?.tier?.can_set_status}
                canSetPriority={!!billing?.tier?.can_set_priority}
                onRemoveFromProject={handleRemoveFromProject}
            />
        </div>
    );
};

export default ProjectDetail;
