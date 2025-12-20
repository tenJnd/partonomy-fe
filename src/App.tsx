import React from "react";
import {BrowserRouter as Router, Navigate, Route, Routes} from "react-router-dom";

import {AuthProvider} from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import LanguageLayout from "./components/LanguageLayout";
import EnvBadge from "./components/EnvBadge";

// pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AcceptInvite from "./pages/AcceptInvite";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import InsightsRFQ from "./pages/InsightsRFQ";
import Landing from "./pages/Landing";
import AuthCallback from "./pages/AuthCallback";

// app shell
import AppShell from "./components/AppShell";

// lang helpers
import {detectBrowserLang, normalizeLang} from "./i18n/lang";

const LANG_STORAGE_KEY = "ui_lang";

/**
 * Redirect from `/` → `/{lang}`
 * Uses:
 * 1) stored lang
 * 2) browser lang
 */
function RootRedirect() {
    let best = detectBrowserLang();

    try {
        const stored = normalizeLang(localStorage.getItem(LANG_STORAGE_KEY));
        best = stored ?? best;
    } catch {
        // ignore (private mode / disabled storage)
    }

    return <Navigate to={`/${best}`} replace/>;
}

const App: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Root → language redirect */}
                    <Route path="/" element={<RootRedirect/>}/>

                    {/* All language-scoped routes */}
                    <Route path="/:lang/*" element={<LanguageLayout/>}>
                        {/* Public */}
                        <Route index element={<Landing/>}/>
                        <Route path="insights" element={<InsightsRFQ/>}/>

                        <Route path="login" element={<Login/>}/>
                        <Route path="signup" element={<Signup/>}/>
                        <Route path="auth/callback" element={<AuthCallback/>}/>
                        <Route path="invite/:token" element={<AcceptInvite/>}/>
                        <Route path="forgot-password" element={<ForgotPassword/>}/>
                        <Route path="reset-password" element={<ResetPassword/>}/>

                        {/* Protected app */}
                        <Route
                            path="app/*"
                            element={
                                <ProtectedRoute>
                                    <AppShell/>
                                </ProtectedRoute>
                            }
                        />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace/>}/>
                </Routes>

                <EnvBadge/>
            </AuthProvider>
        </Router>
    );
};

export default App;
