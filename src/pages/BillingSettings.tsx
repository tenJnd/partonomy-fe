// src/pages/BillingSettings.tsx
import React from "react";
import {Activity, CheckCircle2, CreditCard, ExternalLink, Loader2, XCircle} from "lucide-react";
import {useTranslation} from "react-i18next";
import {useAuth} from "../contexts/AuthContext";
import SettingsShell from "../components/SettingsShell";
import {useOrgBilling} from "../hooks/useOrgBilling";
import {useOrgUsage} from "../hooks/useOrgUsage";
import {getBillingPlanDescription, getBillingPlanTitle} from "../utils/billing";
import PricingPlans from "../components/PricingPlans";
import {useStripeCheckout} from "../hooks/useStripeCheckout";
import {useStripeBillingPortal} from "../hooks/useStripeBillingPortal";
import ErrorAlert from "../components/ErrorAlert";
import {useLocation, useNavigate} from "react-router-dom";

const BillingSettings: React.FC = () => {
    const {t} = useTranslation();
    const {currentOrg} = useAuth();
    const canManageOrg =
        currentOrg?.role === "owner" || currentOrg?.role === "admin";

    // ✅ Checkout status z URL (?checkout=success|cancel)
    const location = useLocation();
    const navigate = useNavigate();

    type CheckoutStatus = "success" | "cancel" | null;

    const checkoutStatus: CheckoutStatus = React.useMemo(() => {
        const p = new URLSearchParams(location.search);
        const v = p.get("checkout");
        return v === "success" || v === "cancel" ? v : null;
    }, [location.search]);

    const [showCheckoutBanner, setShowCheckoutBanner] = React.useState<CheckoutStatus>(null);

    React.useEffect(() => {
        if (!checkoutStatus) return;

        // zobraz banner
        setShowCheckoutBanner(checkoutStatus);

        // odstraň checkout z query stringu (ostatní parametry nech)
        const p = new URLSearchParams(location.search);
        p.delete("checkout");
        const qs = p.toString();

        navigate(
            {pathname: location.pathname, search: qs ? `?${qs}` : ""},
            {replace: true}
        );
    }, [checkoutStatus, location.pathname, location.search, navigate]);

    // 🔹 Hooks – vždy nahoře, bez podmínek
    const {billing, loading: billingLoading} = useOrgBilling();
    const {usage, loading: usageLoading} = useOrgUsage(currentOrg?.org_id);
    const {
        startCheckout,
        loading: checkoutLoading,
        error: checkoutError,
    } = useStripeCheckout();
    const {
        openPortal,
        loading: portalLoading,
        error: portalError,
    } = useStripeBillingPortal();

    if (!currentOrg) {
        return <div className="p-6 max-w-4xl mx-auto">{t("common.loading")}</div>;
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
            title={t("billingSettings.title")}
            description={t("billingSettings.description")}
            canManageOrg={canManageOrg}
        >
            {/* ✅ Checkout success/cancel banner */}
            {showCheckoutBanner === "success" && (
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 mb-4">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0"/>
                        <div className="text-sm flex-1">
                            <div className="font-medium">
                                {t("billingSettings.checkoutSuccessTitle", "Payment successful")}
                            </div>
                            <div className="text-green-700/90 mt-0.5">
                                {t(
                                    "billingSettings.checkoutSuccessDesc",
                                    "Thanks! Your subscription is being activated. This page may update in a few moments."
                                )}
                            </div>

                            {/* Close button: better on mobile */}
                            <button
                                onClick={() => setShowCheckoutBanner(null)}
                                className="mt-3 h-[44px] w-full sm:h-auto sm:w-auto sm:mt-2 sm:inline-flex sm:px-0 text-green-800/80 hover:text-green-900 text-sm font-medium"
                                type="button"
                            >
                                {t("common.close", "Close")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCheckoutBanner === "cancel" && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-xl px-4 py-3 mb-4">
                    <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0"/>
                        <div className="text-sm flex-1">
                            <div className="font-medium">
                                {t("billingSettings.checkoutCanceledTitle", "Checkout canceled")}
                            </div>
                            <div className="text-yellow-800/90 mt-0.5">
                                {t(
                                    "billingSettings.checkoutCanceledDesc",
                                    "No worries — you weren’t charged. You can try again anytime."
                                )}
                            </div>

                            <button
                                onClick={() => setShowCheckoutBanner(null)}
                                className="mt-3 h-[44px] w-full sm:h-auto sm:w-auto sm:mt-2 sm:inline-flex sm:px-0 text-yellow-900/80 hover:text-yellow-900 text-sm font-medium"
                                type="button"
                            >
                                {t("common.close", "Close")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout / portal error */}
            {checkoutError && <ErrorAlert message={checkoutError}/>}
            {portalError && <ErrorAlert message={portalError}/>}

            <div className="space-y-6">
                {/* CURRENT PLAN */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {t("billingSettings.currentPlan")}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {t("billingSettings.currentPlanDescription")}
                            </p>
                        </div>
                    </div>

                    <div className="p-6">
                        {billingLoading ? (
                            <div className="text-sm text-gray-500">
                                {t("billingSettings.loadingBillingInfo")}
                            </div>
                        ) : (
                            <div className="text-center space-y-3">
                                <div
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                                    <CreditCard className="w-4 h-4" strokeWidth={1.5}/>
                                    {planTitle}
                                </div>

                                <p className="text-sm text-gray-500">{planDescription}</p>

                                {canManageOrg && (
                                    <button
                                        type="button"
                                        onClick={openPortal}
                                        disabled={portalLoading}
                                        className="mt-3 h-[44px] w-full sm:w-auto sm:h-auto inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {portalLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5}/>
                                        ) : (
                                            <ExternalLink className="w-4 h-4" strokeWidth={1.5}/>
                                        )}
                                        {portalLoading
                                            ? t("common.openingBillingPortal")
                                            : t("common.manageBilling")}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* USAGE */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {t("billingSettings.usageInCurrentPeriod")}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {t("billingSettings.usageDescription")}
                                </p>

                                {/* period label visible on mobile too */}
                                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 md:hidden">
                                    <Activity className="w-4 h-4" strokeWidth={1.5}/>
                                    <span>{periodLabel}</span>
                                </div>
                            </div>

                            {/* desktop */}
                            <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
                                <Activity className="w-4 h-4" strokeWidth={1.5}/>
                                <span>{periodLabel}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {usageLoading || billingLoading ? (
                            <div className="text-sm text-gray-500">
                                {t("billingSettings.loadingUsage")}
                            </div>
                        ) : maxJobs == null ? (
                            <p className="text-sm text-gray-500">
                                {t("billingSettings.usageLimitsNotConfigured")}
                            </p>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <span>
                                        {jobsUsed} / {maxJobs} jobs this period
                                    </span>
                                    {usagePercent !== null && (
                                        <span className="text-xs text-gray-500">{usagePercent}%</span>
                                    )}
                                </div>

                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-blue-600 transition-all"
                                        style={{width: `${usagePercent ?? 0}%`}}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pricing / upgrade section */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {t("billingSettings.choosePlan")}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {t("billingSettings.choosePlanDescription")}
                        </p>
                    </div>

                    <div className="p-6">
                        {billingLoading ? (
                            <div className="text-sm text-gray-500">
                                {t("billingSettings.loadingBillingInfo")}
                            </div>
                        ) : (
                            <div className="relative">
                                {/* ⬇️ Overlay při vytváření Stripe checkout session */}
                                {checkoutLoading && (
                                    <div
                                        className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm px-4 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mb-2" strokeWidth={1.5}/>
                                        <p className="text-sm text-gray-600">
                                            {t("common.redirectingToCheckout")}
                                        </p>
                                    </div>
                                )}

                                <PricingPlans
                                    mode="billing"
                                    billing={billing}
                                    canManageOrg={canManageOrg && !checkoutLoading}
                                    onSelectStarter={({period, currency}) =>
                                        startCheckout({tier: "starter", period, currency})
                                    }
                                    onSelectPro={({period, currency}) =>
                                        startCheckout({tier: "pro", period, currency})
                                    }
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </SettingsShell>
    );
};

export default BillingSettings;
