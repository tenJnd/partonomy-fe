import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import {Check, LogOut} from "lucide-react";
import {useAuth} from "../contexts/AuthContext";
import {useOrgBilling} from "../hooks/useOrgBilling";
import {getBillingBadgeText} from "../utils/billing";

const TopBar: React.FC = () => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const {user, currentOrg, organizations, switchOrganization, signOut} =
        useAuth();
    const navigate = useNavigate();
    const {billing} = useOrgBilling();

    const handleSignOut = async () => {
        await signOut();
        navigate("/login");
    };

    const getDisplayName = () => {
        const meta = user?.user_metadata as any;
        const fullName = meta?.full_name as string | undefined;

        if (fullName && fullName.trim().length > 0) {
            return fullName;
        }
        return user?.email || "User";
    };

    const getUserInitials = () => {
        const meta = user?.user_metadata as any;
        const fullName = meta?.full_name as string | undefined;

        if (fullName && fullName.trim().length > 0) {
            const parts = fullName.trim().split(/\s+/);
            if (parts.length === 1) {
                return parts[0].substring(0, 2).toUpperCase();
            }
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }

        if (user?.email) {
            return user.email.substring(0, 2).toUpperCase();
        }

        return "U";
    };

    return (
        <div
            className="h-14 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6 relative z-50">
            {/* Left */}
            <div className="flex items-center gap-6">
                {/* Logo stejné jako na landing page */}
                <button
                    type="button"
                    onClick={() => navigate("/documents")}
                    className="flex items-center gap-3 group"
                >
                    <div className="relative">
                        <div
                            className="absolute inset-0 bg-blue-600 blur-md opacity-40 rounded-lg group-hover:opacity-60 transition-opacity"/>
                        <div
                            className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-white shadow-lg">
                            P
                        </div>
                    </div>
                    <span
                        className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Partonomy.ai
          </span>
                </button>

                {/* Tier / trial badge */}
                <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {getBillingBadgeText(billing)}
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center">
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white text-sm font-medium transition-colors"
                    >
                        {getUserInitials()}
                    </button>

                    {showUserMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowUserMenu(false)}
                            />
                            <div
                                className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                                {/* User Info */}
                                <div className="px-4 py-3 border-b border-gray-200">
                                    <div className="text-sm font-medium text-gray-900">
                                        {getDisplayName()}
                                    </div>
                                    {user?.email && (
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {user.email}
                                        </div>
                                    )}
                                    {currentOrg && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {currentOrg.organization.name}
                                        </div>
                                    )}
                                </div>

                                {/* Organization Section */}
                                {organizations.length > 0 && (
                                    <>
                                        <div className="py-2">
                                            <div
                                                className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Switch Organization
                                            </div>
                                            {organizations.map(org => (
                                                <button
                                                    key={org.org_id}
                                                    onClick={() => {
                                                        switchOrganization(org.org_id);
                                                        setShowUserMenu(false);
                                                    }}
                                                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                                                        org.org_id === currentOrg?.org_id
                                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                                            : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {org.org_id === currentOrg?.org_id && (
                                                        <Check className="w-4 h-4"/>
                                                    )}
                                                    <span className={org.org_id === currentOrg?.org_id ? '' : 'ml-6'}>
                            {org.organization.name}
                          </span>
                                                    <span className="ml-auto text-xs text-gray-400 capitalize">
                            {org.role}
                          </span>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="h-px bg-gray-200"/>
                                    </>
                                )}

                                <div className="h-px bg-gray-200"/>

                                {/* Menu Items */}
                                <div className="py-1">
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" strokeWidth={1.5}/>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TopBar;
