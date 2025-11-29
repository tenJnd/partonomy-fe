import React from 'react';
import {CreditCard} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import SettingsShell from '../components/SettingsShell';
import {useOrgBilling} from '../hooks/useOrgBilling';
import {getBillingPlanDescription, getBillingPlanTitle} from '../utils/billing';

const BillingSettings: React.FC = () => {
    const {currentOrg} = useAuth();
    const canManageOrg = currentOrg?.role === 'owner' || currentOrg?.role === 'admin';

    const {billing, loading} = useOrgBilling();

    if (!currentOrg) {
        return <div className="p-6 max-w-4xl mx-auto">Loading...</div>;
    }

    return (
        <SettingsShell
            title="Billing & Usage"
            description="Manage subscription plan and usage limits."
            canManageOrg={canManageOrg}
        >
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage subscription and billing information
                        </p>
                    </div>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="text-sm text-gray-500">Loading billing info...</div>
                    ) : (
                        <div className="text-center py-8">
                            <div
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-3">
                                <CreditCard className="w-4 h-4" strokeWidth={1.5}/>
                                {getBillingPlanTitle(billing)}
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                {getBillingPlanDescription(billing)}
                            </p>
                            <button
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                                disabled={!canManageOrg}
                            >
                                Upgrade Plan
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </SettingsShell>
    );
};

export default BillingSettings;
