// src/pages/BillingSettings.tsx
import React from "react";
import {Activity, CreditCard} from "lucide-react";
import {useAuth} from "../contexts/AuthContext";
import SettingsShell from "../components/SettingsShell";
import {useOrgBilling} from "../hooks/useOrgBilling";
import {useOrgUsage} from "../hooks/useOrgUsage";
import {getBillingPlanDescription, getBillingPlanTitle,} from "../utils/billing";
import PricingPlans from "../components/PricingPlans";

const BillingSettings: React.FC = () => {
    const {currentOrg} = useAuth();
    const canManageOrg = currentOrg?.role === "owner" || currentOrg?.role === "admin";

    const {billing, loading: billingLoading} = useOrgBilling();
    const {usage, loading: usageLoading} = useOrgUsage(currentOrg?.org_id);

    if (!currentOrg) {
        return <div className="p-6 max-w-4xl mx-auto">Loading...</div>;
    }

    const planTitle = getBillingPlanTitle(billing);
    const planDescription = getBillingPlanDescription(billing);

    const jobsUsed = usage?.jobs_used ?? 0;
    const maxJobs = billing?.tier?.max_jobs_per_period ?? null;

    const usagePercent =
        maxJobs && maxJobs > 0
            ? Math.min(100, Math.round((jobsUsed / maxJobs) * 100))
            : null;

    const periodLabel =
        usage && usage.period_start && usage.period_end
            ? `${new Date(usage.period_start).toLocaleDateString()} – ${new Date(
                usage.period_end
            ).toLocaleDateString()}`
            : "Current period";

    return (
        <SettingsShell
            title="Billing & Usage"
            description="Manage subscription plan and usage limits."
            canManageOrg={canManageOrg}
        >
            <div className="space-y-6">
                {/* CURRENT PLAN */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Current plan
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Overview of your subscription status.
                            </p>
                        </div>
                    </div>

                    <div className="p-6">
                        {billingLoading ? (
                            <div className="text-sm text-gray-500">
                                Loading billing info...
                            </div>
                        ) : (
                            <div className="text-center">
                                <div
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-3">
                                    <CreditCard className="w-4 h-4" strokeWidth={1.5}/>
                                    {planTitle}
                                </div>
                                <p className="text-sm text-gray-500">{planDescription}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* USAGE */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Usage in current period
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Jobs processed for this organization in the current billing
                                period.
                            </p>
                        </div>
                        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                            <Activity className="w-4 h-4" strokeWidth={1.5}/>
                            <span>{periodLabel}</span>
                        </div>
                    </div>

                    <div className="p-6">
                        {usageLoading || billingLoading ? (
                            <div className="text-sm text-gray-500">
                                Loading usage information...
                            </div>
                        ) : maxJobs == null ? (
                            <p className="text-sm text-gray-500">
                                Usage limits are not configured for this plan yet.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    {jobsUsed} / {maxJobs} jobs this period
                  </span>
                                    {usagePercent !== null && (
                                        <span className="text-xs text-gray-500">
                      {usagePercent}%
                    </span>
                                    )}
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-blue-600 transition-all"
                                        style={{width: `${usagePercent ?? 0}%`}}
                                    />
                                </div>
                                {/*<p className="text-xs text-gray-400">*/}
                                {/*    Period: {periodLabel}*/}
                                {/*</p>*/}
                            </div>
                        )}
                    </div>
                </div>

                {/* UPGRADE / PRICING */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Upgrade or change plan
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Choose the plan that best fits your volume and team size.
                            </p>
                        </div>
                    </div>

                    <div className="p-6">
                        {billingLoading ? (
                            <div className="text-sm text-gray-500">
                                Loading billing info...
                            </div>
                        ) : (
                            <PricingPlans
                                mode="billing"
                                billing={billing}
                                canManageOrg={canManageOrg}
                                onSelectStarter={() => {
                                    // TODO: edge function -> Stripe checkout pro STARTER
                                    console.log("Stripe checkout: STARTER");
                                }}
                                onSelectPro={() => {
                                    // TODO: edge function -> Stripe checkout pro PRO
                                    console.log("Stripe checkout: PRO");
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </SettingsShell>
    );
};

export default BillingSettings;
