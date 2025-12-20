// supabase/functions/create-billing-portal-session/index.ts
import {serve} from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.48.0";

function requireEnv(name: string): string {
    const value = Deno.env.get(name);
    if (!value) throw new Error(`Missing env var: ${name}`);
    return value;
}

const STRIPE_SECRET_KEY = requireEnv("STRIPE_SECRET_KEY");
const SUPABASE_URL = requireEnv("SB_URL");
const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SB_SERVICE_ROLE_KEY");
const FRONTEND_URL = requireEnv("FRONTEND_URL");

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
});

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type AppLang = "en" | "cs" | "de";

function normalizeLang(input: unknown): AppLang {
    const v = typeof input === "string" ? input.toLowerCase() : "";
    if (v === "cz") return "cs";
    if (v === "en" || v === "cs" || v === "de") return v;
    return "en";
}

function joinUrl(base: string, path: string): string {
    return base.replace(/\/+$/, "") + path;
}

serve(async (req) => {
    if (req.method !== "POST") {
        return new Response("Method not allowed", {status: 405});
    }

    try {
        const body = await req.json();
        const {org_id, lang} = body as { org_id?: string; lang?: string };

        if (!org_id) {
            return new Response(JSON.stringify({error: "Missing org_id"}), {
                status: 400,
                headers: {"Content-Type": "application/json"},
            });
        }

        // najdeme stripe_customer_id pro organizaci
        const {data: billing, error: billingError} = await supabaseAdmin
            .from("organization_billing")
            .select("stripe_customer_id")
            .eq("org_id", org_id)
            .maybeSingle();

        if (billingError) {
            console.error("Error fetching organization_billing:", billingError);
            return new Response(JSON.stringify({error: "Failed to load billing info"}), {
                status: 500,
                headers: {"Content-Type": "application/json"},
            });
        }

        if (!billing?.stripe_customer_id) {
            return new Response(JSON.stringify({error: "Organization has no Stripe customer"}), {
                status: 400,
                headers: {"Content-Type": "application/json"},
            });
        }

        const customerId = billing.stripe_customer_id as string;

        const safeLang = normalizeLang(lang);

        // URL kam se user vrátí po zavření portálu
        const returnPath = `/${safeLang}/app/settings/billing`;
        const returnUrl = joinUrl(FRONTEND_URL, returnPath);

        // vytvoříme Stripe Customer Portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });

        return new Response(JSON.stringify({url: session.url}), {
            status: 200,
            headers: {"Content-Type": "application/json"},
        });
    } catch (err) {
        console.error("Error in create-billing-portal-session:", err);
        return new Response(JSON.stringify({error: "Internal server error"}), {
            status: 500,
            headers: {"Content-Type": "application/json"},
        });
    }
});
