import React from "react";
import {Navigate, useLocation, useParams} from "react-router-dom";
import {useAuth} from "../contexts/AuthContext";
import {Loader} from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({children}) => {
    const {user, loading, orgLoading, needsOnboarding} = useAuth();
    const {lang} = useParams();
    const location = useLocation();

    const safeLang = lang || "en";
    const onboardingPath = `/${safeLang}/app/onboarding`;

    // 1) čekáme jen na auth init
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" strokeWidth={2}/>
                    <p className="text-sm text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // 2) není user -> login (s jazykem)
    if (!user) {
        return <Navigate to={`/${safeLang}/login`} replace/>;
    }

    // 3) onboarding redirect, ale POZOR: pokud už jsme na onboardingPath, tak NEREDIRECTUJ
    if (needsOnboarding && location.pathname !== onboardingPath) {
        return <Navigate to={onboardingPath} replace/>;
    }

    // 4) org loading: jen pokud nejsme na onboarding (tam se orgy typicky už nenačítají / nebo to nechceš blokovat)
    if (orgLoading && location.pathname !== onboardingPath) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" strokeWidth={2}/>
                    <p className="text-sm text-gray-600">Loading organization...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
