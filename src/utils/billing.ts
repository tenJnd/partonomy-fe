// src/utils/billing.ts
import type {OrgBilling} from "../hooks/useOrgBilling";
import type {OrgUsageRow} from "../hooks/useOrgUsage";
import {formatTierLabel} from "./tiers";

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
// ---------------------------------------------
// BADGE TEXT (TopBar)
// ---------------------------------------------
export const getBillingBadgeText = (billing: OrgBilling | null): string => {
    if (!billing) return "Plan inactive";

    if (isInactiveStatus(billing.status)) {
        return "Plan inactive";
    }

    const tierLabel = formatTierLabel(billing.tier?.code);
    const {isTrial, daysLeft} = getTrialInfo(billing);

    if (isTrial && daysLeft !== null) {
        return `${tierLabel} verze · končí za ${daysLeft} ${
            daysLeft === 1 ? "den" : "dní"
        }`;
    }

    // placený plán
    return tierLabel;
};


// ---------------------------------------------
// BILLING PLAN TITLE (BillingSettings)
// ---------------------------------------------
export const getBillingPlanTitle = (billing: OrgBilling | null): string => {
    if (!billing) return "Plan inactive";

    if (isInactiveStatus(billing.status)) {
        return "Plan inactive";
    }

    const tierLabel = formatTierLabel(billing.tier?.code);
    const {isTrial, daysLeft} = getTrialInfo(billing);

    if (isTrial && daysLeft !== null) {
        return `${tierLabel} verze · končí za ${daysLeft} ${
            daysLeft === 1 ? "den" : "dní"
        }`;
    }

    return `${tierLabel} plan`;
};


// ---------------------------------------------
// BILLING PLAN DESCRIPTION (BillingSettings)
// ---------------------------------------------
export const getBillingPlanDescription = (
    billing: OrgBilling | null
): string => {
    if (!billing) return "You are on the free plan.";

    if (isInactiveStatus(billing.status)) {
        return "Your subscription is inactive. You can restart your plan anytime.";
    }

    const {isTrial} = getTrialInfo(billing);

    if (isTrial) {
        return "You are currently in a trial period. You can upgrade at any time.";
    }

    return "Current subscription plan for this organization.";
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

    const isOverLimit =
        maxJobs != null && maxJobs > 0 ? jobsUsed >= maxJobs : false;

    return {
        jobsUsed,
        maxJobs,
        isOverLimit,
    };
};