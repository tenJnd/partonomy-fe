// src/utils/billing.ts
import type {OrgBilling} from "../hooks/useOrgBilling";
import type {OrgUsageRow} from "../hooks/useOrgUsage";
import {formatTierLabel} from "./tiers";
import i18next, {type TFunction} from "i18next";

export interface TrialInfo {
    isTrial: boolean;
    daysLeft: number | null;
    trialEnd: Date | null;
}

export const getTrialInfo = (billing: OrgBilling | null): TrialInfo => {
    if (!billing) return {isTrial: false, daysLeft: null, trialEnd: null};

    const now = new Date();
    const trialEnd = billing.trial_end ? new Date(billing.trial_end) : null;

    const isTrial =
        billing.status === "trial" &&
        trialEnd !== null &&
        trialEnd.getTime() > now.getTime();

    if (!isTrial || !trialEnd) {
        return {isTrial: false, daysLeft: null, trialEnd};
    }

    const diffMs = trialEnd.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return {isTrial: true, daysLeft, trialEnd};
};

export const isActiveStatus = (status?: string | null): boolean => {
    if (!status) return false;

    // Stripe subscription statuses, které chceme považovat za "aktivní přístup"
    // - active: standard
    // - trialing: trial běží (přístup povolen)
    // - past_due: volitelně můžeš dát false, pokud chceš okamžitě omezit
    const s = status.toLowerCase();

    return ["active", "trialing"].includes(s);
};

export const isBillingInactive = (billing: OrgBilling | null): boolean => {
    if (!billing) return true;
    return isInactiveStatus(billing.status);
};

export const isInactiveStatus = (status?: string | null): boolean => {
    if (!status) return true;

    const s = status.toLowerCase();

    // Explicitní "neaktivní" stavy (bez přístupu / plan je pryč)
    if (["canceled", "unpaid", "incomplete_expired", "inactive"].includes(s)) return true;

    // Pokud chceš při past_due už šedit UI, nech true.
    // Pokud chceš grace period, dej false.
    if (s === "past_due") return true;

    // "incomplete" často znamená, že první platba neproběhla.
    if (s === "incomplete") return true;

    // paused (Subscription pause collection) – obvykle bez přístupu
    if (s === "paused") return true;

    // Fallback: vše co není aktivní ber jako inactive
    return !isActiveStatus(s);
};

const defaultT = i18next.t.bind(i18next);

// ---------------------------------------------
// BADGE TEXT (TopBar)
// ---------------------------------------------
export const getBillingBadgeText = (
    billing: OrgBilling | null,
    t: TFunction = defaultT
): string => {
    if (!billing) return t("billing.planInactive");

    if (isInactiveStatus(billing.status)) {
        return t("billing.planInactive");
    }

    const tierLabel = formatTierLabel(billing.tier?.code);
    const {isTrial, daysLeft} = getTrialInfo(billing);

    if (isTrial && daysLeft !== null) {
        return `${tierLabel} ${t("billing.trial.version")} · ${t(
            "billing.trial.endsInDays",
            {count: daysLeft}
        )}`;
    }

    return tierLabel;
};

// ---------------------------------------------
// BILLING PLAN TITLE (BillingSettings)
// ---------------------------------------------
export const getBillingPlanTitle = (
    billing: OrgBilling | null,
    t: TFunction = defaultT
): string => {
    if (!billing) return t("billing.planInactive");

    if (isInactiveStatus(billing.status)) {
        return t("billing.planInactive");
    }

    const tierLabel = formatTierLabel(billing.tier?.code);
    const {isTrial, daysLeft} = getTrialInfo(billing);

    if (isTrial && daysLeft !== null) {
        return `${tierLabel} ${t("billing.trial.version")} · ${t(
            "billing.trial.endsInDays",
            {count: daysLeft}
        )}`;
    }

    return `${tierLabel} ${t("billing.plan")}`;
};

// ---------------------------------------------
// BILLING PLAN DESCRIPTION (BillingSettings)
// ---------------------------------------------
export const getBillingPlanDescription = (
    billing: OrgBilling | null,
    t: TFunction = defaultT
): string => {
    if (!billing) return t("billing.description.freePlan");

    if (isInactiveStatus(billing.status)) {
        return t("billing.description.inactive");
    }

    const {isTrial} = getTrialInfo(billing);

    if (isTrial) {
        return t("billing.description.trial");
    }

    return t("billing.description.current");
};

// ---------------------------------------------
// USAGE HELPERS – FE bezpečné: pouze current row
// ---------------------------------------------
export interface UsageLimitInfo {
    jobsUsed: number;
    maxJobs: number | null;
    isOverLimit: boolean;
}

const parseDateSafe = (value?: string | null): Date | null => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

const toUsageArray = (
    usage: OrgUsageRow | OrgUsageRow[] | null
): OrgUsageRow[] | null => {
    if (!usage) return null;
    return Array.isArray(usage) ? usage : [usage];
};

/**
 * FE-safe výběr usage řádku:
 * - Vrací POUZE řádek, který obsahuje now (period_start <= now < period_end)
 * - Když current row neexistuje (BE ještě nedoplnil), vrací null
 *
 * Žádný fallback na minulou/budoucí periodu (aby UI neblokovalo kvůli starým datům).
 */
export const pickCurrentUsageRow = (
    _billing: OrgBilling | null, // kvůli kompatibilitě signatury, billing nepoužíváme
    usageRows: OrgUsageRow[] | null,
    now: Date = new Date()
): OrgUsageRow | null => {
    if (!usageRows || usageRows.length === 0) return null;

    const nowMs = now.getTime();

    for (const r of usageRows) {
        const ps = parseDateSafe((r as any).period_start ?? null);
        const pe = parseDateSafe((r as any).period_end ?? null);
        if (!ps || !pe) continue;

        if (ps.getTime() <= nowMs && nowMs < pe.getTime()) {
            return r;
        }
    }

    return null;
};

/**
 * Period label pro UI VŽDY z usage current row.
 * Když current usage row ještě neexistuje, ukáže fallback.
 */
export const getCurrentPeriodLabel = (
    billing: OrgBilling | null,
    usage: OrgUsageRow | OrgUsageRow[] | null,
    now: Date = new Date(),
    fallback: string = "Current period"
): string => {
    const usageRows = toUsageArray(usage);
    const current = pickCurrentUsageRow(billing, usageRows, now);

    const ps = parseDateSafe((current as any)?.period_start ?? null);
    const pe = parseDateSafe((current as any)?.period_end ?? null);

    return ps && pe
        ? `${ps.toLocaleDateString()} – ${pe.toLocaleDateString()}`
        : fallback;
};

/**
 * Bezpečný výpočet limitu:
 * - bere POUZE current usage row
 * - když current row není => jobsUsed=0 a isOverLimit=false (NEBLOKUJE UI)
 */
export const getUsageLimitInfo = (
    billing: OrgBilling | null,
    usage: OrgUsageRow | OrgUsageRow[] | null,
    now: Date = new Date()
): UsageLimitInfo => {
    const maxJobs = billing?.tier?.max_jobs_per_period ?? null;

    const usageRows = toUsageArray(usage);
    const currentUsage = pickCurrentUsageRow(billing, usageRows, now);

    const jobsUsed = currentUsage?.jobs_used ?? 0;

    const isOverLimit =
        maxJobs != null && maxJobs > 0 ? jobsUsed >= maxJobs : false;

    return {jobsUsed, maxJobs, isOverLimit};
};

export interface UsageUiInfo extends UsageLimitInfo {
    usagePercent: number | null;
    periodLabel: string;
}

/**
 * One-stop helper pro UI (FE-safe).
 */
export const getUsageUiInfo = (
    billing: OrgBilling | null,
    usage: OrgUsageRow | OrgUsageRow[] | null,
    now: Date = new Date()
): UsageUiInfo => {
    const {jobsUsed, maxJobs, isOverLimit} = getUsageLimitInfo(
        billing,
        usage,
        now
    );

    const usagePercent =
        maxJobs && maxJobs > 0
            ? Math.min(100, Math.round((jobsUsed / maxJobs) * 100))
            : null;

    const periodLabel = getCurrentPeriodLabel(billing, usage, now);

    return {jobsUsed, maxJobs, isOverLimit, usagePercent, periodLabel};
};
