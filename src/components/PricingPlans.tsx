// src/components/PricingPlans.tsx
import React, {useState} from "react";
import {CheckCircle2} from "lucide-react";
import {OrgBilling} from "../hooks/useOrgBilling";
import {TierEnum} from "../lib/database.types";
import {getTrialInfo} from "../utils/billing";

type PricingMode = "landing" | "billing";
export type BillingPeriod = "monthly" | "yearly";
export type Currency = "USD" | "EUR";

interface PricingPlansProps {
    mode: PricingMode;
    billing?: OrgBilling | null;
    canManageOrg?: boolean;
    onStartFree?: () => void;
    onSelectStarter?: (args: { period: BillingPeriod; currency: Currency }) => void;
    onSelectPro?: (args: { period: BillingPeriod; currency: Currency }) => void;
}

const PRICING = {
    starter: {
        drawings: 80,
        monthly: {
            USD: 119,
            EUR: 109,
        },
        yearly: {
            USD: 99,
            EUR: 89,
        },
    },
    pro: {
        drawings: 500,
        monthly: {
            USD: 499,
            EUR: 459,
        },
        yearly: {
            USD: 449,
            EUR: 419,
        },
    },
} as const;

const PricingPlans: React.FC<PricingPlansProps> = ({
                                                       mode,
                                                       billing,
                                                       canManageOrg = true,
                                                       onStartFree,
                                                       onSelectStarter,
                                                       onSelectPro,
                                                   }) => {
    const currentTier = billing?.tier?.code ?? null;
    const {isTrial, daysLeft} = getTrialInfo(billing ?? null);

    const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");
    const [currency, setCurrency] = useState<Currency>("USD");

    const isStarterCurrent = !isTrial && currentTier === ("STARTER" as TierEnum);
    const isProCurrent = !isTrial && currentTier === ("PRO" as TierEnum);

    const starterPrice = PRICING.starter[billingPeriod][currency];
    const starterDrawings = PRICING.starter.drawings;

    const proPrice = PRICING.pro[billingPeriod][currency];
    const proDrawings = PRICING.pro.drawings;

    const currencySymbol = currency === "USD" ? "$" : "€";

    const periodLabel =
        billingPeriod === "yearly"
            ? "měsíčně, účtováno ročně"
            : "měsíčně, účtováno měsíčně";

    // handlery pro Stripe checkout – vždy pošlou period + currency
    const handleSelectStarter = () => {
        if (!onSelectStarter) return;
        onSelectStarter({period: billingPeriod, currency});
    };

    const handleSelectPro = () => {
        if (!onSelectPro) return;
        onSelectPro({period: billingPeriod, currency});
    };

    // --- BUTTON LABELS (billing mode) ---
    const starterButtonLabel = (() => {
        if (mode === "landing") return "";

        if (isTrial) {
            return "Vybrat Starter";
        }

        if (isStarterCurrent) return "Aktuální plán";
        if (isProCurrent) return "Downgrade na Starter";

        return "Vybrat Starter";
    })();

    const proButtonLabel = (() => {
        if (mode === "landing") return "";

        if (isTrial) {
            return "Vybrat Pro";
        }

        if (isProCurrent) return "Aktuální plán";
        if (isStarterCurrent) return "Upgrade na Pro";

        return "Vybrat Pro";
    })();

    const starterDisabled =
        mode === "billing" &&
        (!canManageOrg || isStarterCurrent || !onSelectStarter);

    const proDisabled =
        mode === "billing" &&
        (!canManageOrg || (!isTrial && isProCurrent) || !onSelectPro);

    return (
        <section
            id={mode === "landing" ? "pricing" : undefined}
            className={`${mode === "landing" ? "py-20" : "pt-6 pb-10"} bg-white`}
        >
            <div className="mx-auto max-w-7xl px-6">
                {/* Header jen na Landing */}
                {mode === "landing" && (
                    <div className="text-center mb-6">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                            Jednoduchý ceník
                        </h2>
                        <p className="text-sm md:text-lg text-slate-600">
                            Začněte zdarma, plaťte podle potřeby
                        </p>
                        <p className="text-xs md:text-sm text-slate-500 mt-2">
                            Platíte jen za <span className="font-semibold">uživatele</span> a{" "}
                            <span className="font-semibold">
                počet zpracovaných výkresů/stránek
              </span>
                            . Žádné skryté moduly, žádné konzultační balíčky.
                        </p>
                    </div>
                )}

                {/* Společný řádek: billing period + currency */}
                <div className="flex justify-center mb-12">
                    <div className="inline-flex items-center bg-slate-100 rounded-full p-1 text-xs shadow-sm gap-1">
                        {/* Popisek vlevo */}
                        <span className="px-3 py-1 text-slate-500 text-xs">účtováno:</span>

                        {/* Billing period toggle */}
                        <div className="inline-flex items-center bg-slate-100 rounded-full p-1 text-xs shadow-sm">
                            <button
                                type="button"
                                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                                    billingPeriod === "yearly"
                                        ? "bg-white shadow-sm text-slate-900"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                                onClick={() => setBillingPeriod("yearly")}
                            >
                                Ročně{" "}
                                <span className="ml-1 text-[10px] uppercase tracking-wide text-emerald-600">
                  Sleva
                </span>
                            </button>
                            <button
                                type="button"
                                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                                    billingPeriod === "monthly"
                                        ? "bg-white shadow-sm text-slate-900"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                                onClick={() => setBillingPeriod("monthly")}
                            >
                                Měsíčně
                            </button>
                        </div>

                        {/* Currency toggle */}
                        <div className="inline-flex bg-slate-100 rounded-full p-1 text-xs shadow-sm">
                            <button
                                type="button"
                                onClick={() => setCurrency("USD")}
                                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                                    currency === "USD"
                                        ? "bg-white shadow text-slate-900"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                USD $
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrency("EUR")}
                                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                                    currency === "EUR"
                                        ? "bg-white shadow text-slate-900"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                EUR €
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Starter plan */}
                    <div
                        className="relative p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 hover:border-slate-300 transition-all hover:shadow-xl h-full flex flex-col">
                        {mode === "billing" && isStarterCurrent && !isTrial && (
                            <div
                                className="absolute -top-4 left-4 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                                Aktuální plán
                            </div>
                        )}

                        {/* obsah karty */}
                        <div>
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                                    Starter
                                </h3>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-900">
                      {currencySymbol}
                        {starterPrice}
                    </span>
                                        <span className="text-slate-600">
                      / {starterDrawings} výkresů
                    </span>
                                    </div>
                                    <span className="text-xs text-slate-500">{periodLabel}</span>
                                </div>
                                <p className="mt-4 text-slate-600">
                                    Ideální pro menší dílny a pilotní provoz
                                </p>
                                {mode === "billing" && isTrial && daysLeft !== null && (
                                    <p className="mt-2 text-xs text-slate-500">
                                        Běží trial ({daysLeft}{" "}
                                        {daysLeft === 1 ? "den zbývá" : "dní zbývá"}). Zvolený plán
                                        začne po skončení trialu.
                                    </p>
                                )}
                            </div>

                            <ul className="space-y-4">
                                {[
                                    "80 výkresů/stránek měsíčně",
                                    "1 uživatel",
                                    "Analýza výkresů z rastrových PDF/obrázků",
                                    "Přehledný seznam zpracovaných dokumentů",
                                    "Rychlé shrnutí a report pro každý díl",
                                    "Email podpora",
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"/>
                                        <span className="text-slate-700">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* footer s buttonem přilepený dole */}
                        {mode === "billing" && (
                            <div className="mt-auto pt-8">
                                <button
                                    onClick={handleSelectStarter}
                                    className={`w-full py-4 px-6 rounded-xl font-semibold transition-colors ${
                                        starterDisabled
                                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                            : "text-slate-900 bg-slate-100 hover:bg-slate-200"
                                    }`}
                                    disabled={starterDisabled}
                                >
                                    {starterButtonLabel}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Pro plan */}
                    <div
                        className="relative p-8 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 border-2 border-blue-500 shadow-2xl shadow-blue-600/30 transform md:scale-105 h-full flex flex-col">
                        <div
                            className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 text-sm font-bold rounded-full">
                            Nejoblíbenější
                        </div>

                        {mode === "billing" && isProCurrent && !isTrial && (
                            <div
                                className="absolute -top-4 right-4 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                                Aktuální plán
                            </div>
                        )}

                        {/* obsah karty */}
                        <div>
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">
                      {currencySymbol}
                        {proPrice}
                    </span>
                                        <span className="text-blue-100">
                      / {proDrawings} výkresů
                    </span>
                                    </div>
                                    <span className="text-xs text-blue-100/80">
                    {billingPeriod === "yearly"
                        ? "měsíčně, účtováno ročně"
                        : "měsíčně, účtováno měsíčně"}
                  </span>
                                </div>
                                <p className="mt-4 text-blue-100">
                                    Pro firmy s desítkami až stovkami výkresů měsíčně
                                </p>
                                {mode === "billing" && isTrial && daysLeft !== null && (
                                    <p className="mt-2 text-xs text-blue-100/80">
                                        Běží trial ({daysLeft}{" "}
                                        {daysLeft === 1 ? "den zbývá" : "dní zbývá"}). Zvolený plán
                                        začne po skončení trialu.
                                    </p>
                                )}
                            </div>

                            <ul className="space-y-4">
                                {[
                                    "Vše ze Starter plánu",
                                    "500 výkresů/stránek měsíčně",
                                    "10 uživatelů",
                                    "Prioritní podpora",
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-blue-200 mt-0.5 flex-shrink-0"/>
                                        <span className="text-white">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* footer s buttonem přilepený dole */}
                        {mode === "billing" && (
                            <div className="mt-auto pt-8">
                                <button
                                    onClick={handleSelectPro}
                                    className={`w-full py-4 px-6 rounded-xl font-semibold shadow-lg transition-colors ${
                                        proDisabled
                                            ? "bg-white/40 text-blue-200 cursor-not-allowed"
                                            : "text-blue-700 bg-white hover:bg-blue-50"
                                    }`}
                                    disabled={proDisabled}
                                >
                                    {proButtonLabel}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Landing CTA – jedno tlačítko dole */}
                {mode === "landing" && (
                    <div className="text-center mt-12">
                        <button
                            onClick={onStartFree}
                            className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md transition-all active:scale-[0.98]"
                        >
                            Začít zdarma
                        </button>
                        <p className="text-sm text-slate-600 mt-4">
                            Potřebujete větší objem nebo on-premise řešení?{" "}
                            <a
                                href="#"
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Kontaktujte nás →
                            </a>
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default PricingPlans;
