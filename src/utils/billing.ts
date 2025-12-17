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

export const isInactiveStatus = (status?: string | null): boolean => {
    if (!status) return false;
    return ["canceled", "past_due", "unpaid", "inactive"].includes(
        status.toLowerCase()
    );
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

    // placený plán
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
// USAGE LIMIT INFO – pro Documents & další
// ---------------------------------------------
export interface UsageLimitInfo {
    jobsUsed: number;
    maxJobs: number | null;
    isOverLimit: boolean;
}

/**
 * Vrátí efektivní limit pro aktuální plán (TRIAL / STARTER / PRO),
 * kolik jobů bylo použito a jestli je limit překročen.
 *
 * Trial je samostatný tier, takže maxJobs bereme z billing.tier.max_jobs_per_period.
 */
export const getUsageLimitInfo = (
    billing: OrgBilling | null,
    usage: OrgUsageRow | null
): UsageLimitInfo => {
    const jobsUsed = usage?.jobs_used ?? 0;
    const maxJobs = billing?.tier?.max_jobs_per_period ?? null;

    const isOverLimit = maxJobs != null && maxJobs > 0 ? jobsUsed >= maxJobs : false;

    return {
        jobsUsed,
        maxJobs,
        isOverLimit
    };
};
