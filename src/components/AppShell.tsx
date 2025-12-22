import React from "react";
import {Menu} from "lucide-react";
import {Navigate, Route, Routes} from "react-router-dom";
import {useAuth} from "../contexts/AuthContext";

import TopBar from "./TopBar";
import Sidebar from "./Sidebar";

import Documents from "../pages/Documents";
import Projects from "../pages/Projects";
import DocumentDetail from "../pages/DocumentDetail";
import ProjectDetail from "../pages/ProjectDetail";

import ReportSettings from "../pages/ReportSettings";
import BillingSettings from "../pages/BillingSettings";
import OrganizationSettings from "../pages/OrganizationSettings";
import OnboardingOrg from "../pages/OnboardingOrg"; // ⬅ nový page

const SIDEBAR_COLLAPSED_KEY = "ui_sidebar_collapsed";

const AppShell: React.FC = () => {
    const {needsOnboarding} = useAuth();

    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState<boolean>(() => {
        try {
            const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
            return saved ? saved === "1" : true;
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
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    isCollapsed={sidebarCollapsed}
                    onToggleCollapse={toggleCollapsed}
                />

                <main className="flex-1 overflow-y-auto">
                    <div className="md:hidden sticky top-0 z-20 bg-gray-50/90 backdrop-blur border-b border-gray-100">
                        <div className="px-4 py-2">
                            {!sidebarOpen && (
                                <button
                                    type="button"
                                    onClick={() => setSidebarOpen(true)}
                                    aria-label="Open sidebar"
                                    className="w-10 h-10 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                                >
                                    <Menu className="w-5 h-5 text-gray-600"/>
                                </button>
                            )}
                        </div>
                    </div>

                    <Routes>
                        {/* index: když nemá org, pošli ho do onboarding */}
                        <Route
                            index
                            element={<Navigate to={needsOnboarding ? "onboarding" : "documents"} replace/>}
                        />

                        <Route path="onboarding" element={<OnboardingOrg/>}/>

                        <Route path="documents" element={<Documents/>}/>
                        <Route path="documents/:documentId" element={<DocumentDetail/>}/>

                        <Route path="projects" element={<Projects/>}/>
                        <Route path="projects/:projectId" element={<ProjectDetail/>}/>

                        <Route path="settings/report" element={<ReportSettings/>}/>
                        <Route path="settings/billing" element={<BillingSettings/>}/>
                        <Route path="settings/organization" element={<OrganizationSettings/>}/>

                        {/* fallback: když nemá org, drž ho v onboarding */}
                        <Route
                            path="*"
                            element={<Navigate to={needsOnboarding ? "onboarding" : "documents"} replace/>}
                        />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default AppShell;
