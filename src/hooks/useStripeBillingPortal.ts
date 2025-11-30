// src/hooks/useStripeBillingPortal.ts
import {useCallback, useState} from "react";
import {supabase} from "../lib/supabase";
import {useAuth} from "../contexts/AuthContext";

export function useStripeBillingPortal() {
    const {currentOrg} = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const openPortal = useCallback(async () => {
        if (!currentOrg) {
            setError("You must have an active organization.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const {data, error} = await supabase.functions.invoke(
                "create-billing-portal-session",
                {
                    body: {
                        org_id: currentOrg.org_id,
                    },
                }
            );

            if (error) {
                console.error("[useStripeBillingPortal] Error:", error);
                setError("We couldn't open the billing portal. Please try again.");

                return;
            }

            if (!data?.url) {
                setError("Something went wrong. Please try again.");
                return;
            }

            // přesměrování do Stripe Customer Portalu
            window.location.href = data.url;
        } catch (err: any) {
            console.error("[useStripeBillingPortal] Exception:", err);
            setError("Something went wrong while contacting billing portal.");

        } finally {
            setLoading(false);
        }
    }, [currentOrg]);

    return {openPortal, loading, error};
}
