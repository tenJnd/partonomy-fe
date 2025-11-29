// src/hooks/useStripeCheckout.ts
import { useCallback, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export type BillingPeriod = "monthly" | "yearly";
export type Currency = "USD" | "EUR";
export type PaidTier = "STARTER" | "PRO";

interface CheckoutArgs {
  tier: PaidTier;
  period: BillingPeriod;
  currency: Currency;
}

export function useStripeCheckout() {
  const { currentOrg, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(
    async ({ tier, period, currency }: CheckoutArgs) => {
      if (!currentOrg || !user) {
        setError("You must be signed in and have an active organization.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.functions.invoke(
          "create-checkout-session",
          {
            body: {
              tier,
              period,
              currency,
              org_id: currentOrg.org_id,
              user_id: user.id,
            },
          }
        );

        if (error) {
          console.error("[useStripeCheckout] Error:", error);
          setError(error.message ?? "Failed to start checkout.");
          return;
        }

        if (!data?.url) {
          setError("Stripe checkout URL was not returned.");
          return;
        }

        window.location.href = data.url;
      } catch (err: any) {
        console.error("[useStripeCheckout] Exception:", err);
        setError(err.message ?? "Unexpected error while starting checkout.");
      } finally {
        setLoading(false);
      }
    },
    [currentOrg, user]
  );

  return { startCheckout, loading, error };
}
