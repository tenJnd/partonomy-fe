// src/utils/tiers.ts
import {TierEnum} from "../lib/database.types";

const TIER_LABELS: Record<TierEnum, string> = {
    FREE: "Free",
    STARTER: "Starter",
    PRO: "Pro",
    ENTERPRISE: "Enterprise",
};

export const formatTierLabel = (code?: TierEnum | null): string => {
    if (!code) return "Starter";
    return TIER_LABELS[code] ?? "Starter";
};
