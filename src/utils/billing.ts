// src/utils/billing.ts
import type {OrgBilling} from "../hooks/useOrgBilling";
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

const isInactiveStatus = (status?: string | null): boolean => {
    if (!status) return false;
    return ["canceled", "past_due", "unpaid", "inactive"].includes(status);
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
        return `${tierLabel} ${daysLeft} ${
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
        return `${tierLabel} ${daysLeft} ${
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
