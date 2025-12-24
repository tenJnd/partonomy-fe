// supabase/functions/create-checkout-session/index.ts
import {serve} from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.48.0";

function requireEnv(name: string): string {
    const value = Deno.env.get(name);
    if (!value) throw new Error(`Missing env var: ${name}`);
    return value;
}

const STRIPE_SECRET_KEY = requireEnv("STRIPE_SECRET_KEY");
const APP_URL = requireEnv("APP_URL");
const SUPABASE_URL = requireEnv("SB_URL");
const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SB_SERVICE_ROLE_KEY");

// Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY, {apiVersion: "2024-06-20"});

// We use service role key here, but authentication comes from the Bearer token in the request header.
// Also keep Verify JWT = ON in Supabase for this function.
function supabaseAuthedClient(req: Request) {
    const auth = req.headers.get("Authorization") ?? "";
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        global: {
            headers: {
                Authorization: auth,
            },
        },
    });
}

type Tier = "starter" | "pro";
type Period = "monthly" | "yearly";
type Currency = "USD" | "EUR";
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

// Validate price env vars early and clearly
const PRICE_MAP: Record<Tier, Record<Period, Record<Currency, string>>> = {
    starter: {
        monthly: {
            USD: requireEnv("STRIPE_PRICE_STARTER_MONTHLY_USD"),
            EUR: requireEnv("STRIPE_PRICE_STARTER_MONTHLY_EUR"),
        },
        yearly: {
            USD: requireEnv("STRIPE_PRICE_STARTER_YEARLY_USD"),
            EUR: requireEnv("STRIPE_PRICE_STARTER_YEARLY_EUR"),
        },
    },
    pro: {
        monthly: {
            USD: requireEnv("STRIPE_PRICE_PRO_MONTHLY_USD"),
            EUR: requireEnv("STRIPE_PRICE_PRO_MONTHLY_EUR"),
        },
        yearly: {
            USD: requireEnv("STRIPE_PRICE_PRO_YEARLY_USD"),
            EUR: requireEnv("STRIPE_PRICE_PRO_YEARLY_EUR"),
        },
    },
};

const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
    // CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", {headers: corsHeaders});
    }

    if (req.method !== "POST") {
        return new Response("Method not allowed", {status: 405, headers: corsHeaders});
    }

    try {
        // Auth: user must be authenticated (also enforced by Verify JWT = ON)
        const supabase = supabaseAuthedClient(req);
        const {data: userRes, error: userErr} = await supabase.auth.getUser();

        if (userErr || !userRes?.user) {
            return new Response(JSON.stringify({error: "Unauthorized"}), {
                status: 401,
                headers: {...corsHeaders, "Content-Type": "application/json"},
            });
        }

        const authedUserId = userRes.user.id;

        const body = await req.json();
        const {tier, period, currency, org_id, lang} = body as {
            tier: Tier;
            period: Period;
            currency: Currency;
            org_id: string;
            lang?: string;
        };

        if (!tier || !period || !currency || !org_id) {
            return new Response(JSON.stringify({error: "Missing required fields"}), {
                status: 400,
                headers: {...corsHeaders, "Content-Type": "application/json"},
            });
        }

        const priceId = PRICE_MAP[tier]?.[period]?.[currency];
        if (!priceId) {
            console.error("Unknown price combination:", {tier, period, currency});
            return new Response(JSON.stringify({error: "Invalid pricing combination"}), {
                status: 400,
                headers: {...corsHeaders, "Content-Type": "application/json"},
            });
        }

        const safeLang = normalizeLang(lang);

        // Optional: Stripe customer email (nice-to-have)
        const userEmail = userRes.user.email ?? undefined;

        const successPath = `/${safeLang}/app/settings/billing?checkout=success`;
        const cancelPath = `/${safeLang}/app/settings/billing?checkout=cancel`;
        const successUrl = joinUrl(APP_URL, successPath);
        const cancelUrl = joinUrl(APP_URL, cancelPath);

        const metadata = {
            org_id,
            user_id: authedUserId,
            tier,
            period,
            currency,
            lang: safeLang,
        };

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [{price: priceId, quantity: 1}],
            success_url: successUrl,
            cancel_url: cancelUrl,

            // optional
            customer_email: userEmail,

            // Put identifiers on session + subscription, so webhook can map it reliably
            metadata,
            subscription_data: {metadata},

            billing_address_collection: "required",
            automatic_tax: {enabled: true},
            tax_id_collection: {enabled: true},

            client_reference_id: org_id,
            allow_promotion_codes: true,
        });

        if (!session.url) {
            console.error("Stripe session has no URL", session);
            return new Response(JSON.stringify({error: "Stripe session created without URL"}), {
                status: 500,
                headers: {...corsHeaders, "Content-Type": "application/json"},
            });
        }

        return new Response(JSON.stringify({url: session.url}), {
            status: 200,
            headers: {...corsHeaders, "Content-Type": "application/json"},
        });
    } catch (err) {
        console.error("Error in create-checkout-session:", err);
        return new Response(JSON.stringify({error: "Internal server error"}), {
            status: 500,
            headers: {...corsHeaders, "Content-Type": "application/json"},
        });
    }
});
