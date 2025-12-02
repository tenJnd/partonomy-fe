// src/utils/tiers.ts
import {TierEnum} from "../lib/database.types";

const TIER_LABELS: Record<TierEnum, string> = {
    free: "Free",
    trial: "Trial",
    starter: "Starter",
    pro: "Pro",
    enterprise: "Enterprise",
};

export const formatTierLabel = (code?: TierEnum | string | null): string => {
    if (!code) return "Starter";

    const normalized = (code as string).toUpperCase() as TierEnum;

    return TIER_LABELS[normalized] ?? "Starter";
};
