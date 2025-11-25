import React, {useEffect, useState} from 'react';
import {BrowserRouter as Router, Route, Routes, useLocation,} from 'react-router-dom';
import {Menu} from 'lucide-react';

import {AuthProvider} from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';

import Documents from './pages/Documents';
import DocumentDetail from './pages/DocumentDetail';

// Settings pages
import ReportSettings from './pages/ReportSettings';
import BillingSettings from './pages/BillingSettings';
import OrganizationSettings from './pages/OrganizationSettings';

// Auth pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import AcceptInvite from './pages/AcceptInvite';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Landing page
import Landing from './pages/Landing';

const AppLayout: React.FC = () => {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (
            location.pathname.startsWith('/documents/') &&
            location.pathname !== '/documents'
        ) {
            setSidebarCollapsed(true);
        }
    }, [location.pathname]);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
            <TopBar/>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Mobile toggle button */}
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
                        {/* Dashboard */}
                        <Route path="/documents" element={<Documents/>}/>
                        <Route path="/documents/:documentId" element={<DocumentDetail/>}/>

                        {/* Settings */}
                        <Route path="/settings/report" element={<ReportSettings/>}/>
                        <Route path="/settings/billing" element={<BillingSettings/>}/>
                        <Route
                            path="/settings/organization"
                            element={<OrganizationSettings/>}
                        />

                        {/* Fallback – po přihlášení tě hodí do Documents */}
                        <Route path="*" element={<Documents/>}/>
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
                    {/* Public landing – s podmínkou na přihlášení */}
                    <Route path="/" element={<Landing/>}/>

                    {/* Public auth routes */}
                    <Route path="/login" element={<Login/>}/>
                    <Route path="/signup" element={<Signup/>}/>
                    <Route path="/invite/:token" element={<AcceptInvite/>}/>
                    <Route path="/forgot-password" element={<ForgotPassword/>}/>
                    <Route path="/reset-password" element={<ResetPassword/>}/>

                    {/* Protected app (dashboard + settings) */}
                    <Route
                        path="/*"
                        element={
                            <ProtectedRoute>
                                <AppLayout/>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </AuthProvider>
        </Router>
    );
};

export default App;
