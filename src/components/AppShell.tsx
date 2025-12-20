import React from "react";
import {Menu} from "lucide-react";
import {Navigate, Route, Routes} from "react-router-dom";

import TopBar from "./TopBar";
import Sidebar from "./Sidebar";

import Documents from "../pages/Documents";
import Projects from "../pages/Projects";
import DocumentDetail from "../pages/DocumentDetail";
import ProjectDetail from "../pages/ProjectDetail";

import ReportSettings from "../pages/ReportSettings";
import BillingSettings from "../pages/BillingSettings";
import OrganizationSettings from "../pages/OrganizationSettings";

const SIDEBAR_COLLAPSED_KEY = "ui_sidebar_collapsed";

const AppShell: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    const [sidebarCollapsed, setSidebarCollapsed] = React.useState<boolean>(() => {
        try {
            const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
            return saved ? saved === "1" : true; // default collapsed
        } catch {
            return true;
        }
    });

    const toggleCollapsed = () => {
        setSidebarCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
            } catch {
            }
            return next;
        });
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
            <TopBar/>

            <div className="flex flex-1 overflow-hidden relative">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="fixed top-[4.5rem] left-4 z-50 md:hidden w-10 h-10 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                    <Menu className="w-5 h-5 text-gray-600"/>
                </button>

                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    isCollapsed={sidebarCollapsed}
                    onToggleCollapse={toggleCollapsed}
                />

                <main className="flex-1 overflow-y-auto">
                    <Routes>
                        <Route index element={<Navigate to="documents" replace/>}/>

                        <Route path="documents" element={<Documents/>}/>
                        <Route path="documents/:documentId" element={<DocumentDetail/>}/>

                        <Route path="projects" element={<Projects/>}/>
                        <Route path="projects/:projectId" element={<ProjectDetail/>}/>

                        <Route path="settings/report" element={<ReportSettings/>}/>
                        <Route path="settings/billing" element={<BillingSettings/>}/>
                        <Route path="settings/organization" element={<OrganizationSettings/>}/>

                        <Route path="*" element={<Navigate to="documents" replace/>}/>
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default AppShell;
