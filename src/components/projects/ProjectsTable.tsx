// src/components/projects/ProjectsTable.tsx
import React from "react";
import type {ProjectsTableProps} from "./projectsTable.types";
import ProjectsDesktopTable from "./ProjectsDesktopTable";
import ProjectsCards from "./ProjectsCards";

const ProjectsTable: React.FC<ProjectsTableProps> = (props) => {
    // stejně jako u DocumentsTable: wrapper drží jen layout / switch
    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Mobile cards */}
            <div className="block md:hidden">
                <ProjectsCards {...props} />
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
                <ProjectsDesktopTable {...props} />
            </div>
        </div>
    );
};

export default ProjectsTable;
