// src/hooks/useStripeCheckout.ts
import {useCallback, useState} from "react";
import {supabase} from "../lib/supabase";
import {useAuth} from "../contexts/AuthContext";
import {useLang} from "./useLang.ts";

export type BillingPeriod = "monthly" | "yearly";
export type Currency = "USD" | "EUR";
export type PaidTier = "starter" | "pro";

interface CheckoutArgs {
    tier: PaidTier;
    period: BillingPeriod;
    currency: Currency;
}

export function useStripeCheckout() {
    const {currentOrg, user} = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const lang = useLang();

    const startCheckout = useCallback(
        async ({tier, period, currency}: CheckoutArgs) => {
            if (!currentOrg || !user) {
                setError("You must be signed in and have an active organization.");
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const {data, error} = await supabase.functions.invoke(
                    "create-checkout-session",
                    {
                        body: {
                            tier,
                            period,
                            currency,
                            org_id: currentOrg.org_id,
                            lang
                        },
                    }
                );

                if (error) {
                    console.error("[useStripeCheckout] Error:", error);
                    setError("We couldn't start the checkout process. Please try again.");
                    return;
                }

                if (!data?.url) {
                    setError("Something went wrong. Please try again.");
                    return;
                }

                window.location.href = data.url;
            } catch (err: any) {
                console.error("[useStripeCheckout] Exception:", err);
                setError("Something went wrong while connecting to checkout.");
            } finally {
                setLoading(false);
            }
        },
        [currentOrg, user, lang]
    );

    return {startCheckout, loading, error};
}
