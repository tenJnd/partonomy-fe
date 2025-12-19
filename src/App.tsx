import React, {useEffect, useState} from "react";
import {Menu} from "lucide-react";
import {BrowserRouter as Router, Navigate, Route, Routes, useLocation,} from "react-router-dom";

import {AuthProvider} from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";

import Documents from "./pages/Documents";
import Projects from "./pages/Projects";
import DocumentDetail from "./pages/DocumentDetail";
import ProjectDetail from "./pages/ProjectDetail";

import ReportSettings from "./pages/ReportSettings";
import BillingSettings from "./pages/BillingSettings";
import OrganizationSettings from "./pages/OrganizationSettings";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AcceptInvite from "./pages/AcceptInvite";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import InsightsRFQ from "./pages/InsightsRFQ";
import Landing from "./pages/Landing";

import LanguageLayout from "./components/LanguageLayout";
import EnvBadge from "./components/EnvBadge";

// ✅ přidej importy pro lang
import {detectBrowserLang, normalizeLang} from "./i18n/lang";

const LANG_STORAGE_KEY = "ui_lang";

function RootRedirect() {
    let best = detectBrowserLang();

    try {
        const stored = normalizeLang(localStorage.getItem(LANG_STORAGE_KEY));
        best = stored ?? best;
    } catch {
        // ignore (private mode / disabled storage / tests)
    }

    return <Navigate to={`/${best}`} replace/>;
}

const AppLayout: React.FC = () => {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        const shouldCollapse =
            location.pathname.includes("/app/documents/") &&
            !location.pathname.endsWith("/app/documents");

        setSidebarCollapsed((prev) => (prev === shouldCollapse ? prev : shouldCollapse));
    }, [location.pathname]);

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
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
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

const App: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* ✅ Root: použij stored lang nebo browser lang */}
                    <Route path="/" element={<RootRedirect/>}/>

                    {/* Vše pod /:lang/... */}
                    <Route path="/:lang/*" element={<LanguageLayout/>}>
                        {/* Public */}
                        <Route index element={<Landing/>}/>
                        <Route path="insights" element={<InsightsRFQ/>}/>

                        <Route path="login" element={<Login/>}/>
                        <Route path="signup" element={<Signup/>}/>
                        <Route path="invite/:token" element={<AcceptInvite/>}/>
                        <Route path="forgot-password" element={<ForgotPassword/>}/>
                        <Route path="reset-password" element={<ResetPassword/>}/>

                        {/* App */}
                        <Route
                            path="app/*"
                            element={
                                <ProtectedRoute>
                                    <AppLayout/>
                                </ProtectedRoute>
                            }
                        />
                    </Route>

                    {/* Unknown -> root */}
                    <Route path="*" element={<Navigate to="/" replace/>}/>
                </Routes>
                <EnvBadge/>
            </AuthProvider>
        </Router>
    );
};

export default App;
