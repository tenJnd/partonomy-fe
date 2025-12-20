// supabase/functions/create-checkout-session/index.ts
import {serve} from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.48.0";

function requireEnv(name: string): string {
    const value = Deno.env.get(name);
    if (!value) throw new Error(`Missing env var: ${name}`);
    return value;
}

const STRIPE_SECRET_KEY = requireEnv("STRIPE_SECRET_KEY");
const FRONTEND_URL = requireEnv("FRONTEND_URL");
const SUPABASE_URL = requireEnv("SB_URL");
const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SB_SERVICE_ROLE_KEY");

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
});

// jen na READ user emailu – žádné zápisy do billing
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    // base: "https://example.com" (nebo s trailing slash)
    // path: "/en/app/..."
    return base.replace(/\/+$/, "") + path;
}

const PRICE_MAP: Record<Tier, Record<Period, Record<Currency, string>>> = {
    starter: {
        monthly: {
            USD: Deno.env.get("STRIPE_PRICE_STARTER_MONTHLY_USD")!,
            EUR: Deno.env.get("STRIPE_PRICE_STARTER_MONTHLY_EUR")!,
        },
        yearly: {
            USD: Deno.env.get("STRIPE_PRICE_STARTER_YEARLY_USD")!,
            EUR: Deno.env.get("STRIPE_PRICE_STARTER_YEARLY_EUR")!,
        },
    },
    pro: {
        monthly: {
            USD: Deno.env.get("STRIPE_PRICE_PRO_MONTHLY_USD")!,
            EUR: Deno.env.get("STRIPE_PRICE_PRO_MONTHLY_EUR")!,
        },
        yearly: {
            USD: Deno.env.get("STRIPE_PRICE_PRO_YEARLY_USD")!,
            EUR: Deno.env.get("STRIPE_PRICE_PRO_YEARLY_EUR")!,
        },
    },
};

serve(async (req) => {
    if (req.method !== "POST") {
        return new Response("Method not allowed", {status: 405});
    }

    try {
        const body = await req.json();
        const {tier, period, currency, org_id, user_id, lang} = body as {
            tier: Tier;
            period: Period;
            currency: Currency;
            org_id: string;
            user_id: string;
            lang?: string;
        };

        if (!tier || !period || !currency || !org_id || !user_id) {
            return new Response(JSON.stringify({error: "Missing required fields"}), {
                status: 400,
                headers: {"Content-Type": "application/json"},
            });
        }

        const priceId = PRICE_MAP[tier]?.[period]?.[currency];
        if (!priceId) {
            console.error("Unknown price combination:", {tier, period, currency});
            return new Response(
                JSON.stringify({error: "Invalid pricing combination"}),
                {status: 400, headers: {"Content-Type": "application/json"}},
            );
        }

        const safeLang = normalizeLang(lang);

        // Volitelně si vytáhneme email usera pro Stripe (není nutné pro org_id flow)
        let userEmail: string | undefined = undefined;
        try {
            const {data: userData, error: userError} =
                await supabaseAdmin.auth.admin.getUserById(user_id);

            if (userError) {
                console.error("Error fetching user for Stripe email:", userError);
            } else {
                userEmail = userData?.user?.email ?? undefined;
            }
        } catch (e) {
            console.error("Exception when fetching user for Stripe email:", e);
        }

        const successPath = `/${safeLang}/app/settings/billing?checkout=success`;
        const cancelPath = `/${safeLang}/app/settings/billing?checkout=cancel`;

        const successUrl = joinUrl(FRONTEND_URL, successPath);
        const cancelUrl = joinUrl(FRONTEND_URL, cancelPath);

        const metadata = {
            org_id,
            user_id,
            tier,
            period,
            currency,
            lang: safeLang,
        };

        // Stripe vytvoří Customer automaticky;
        // my jen přidáme metadata na session + subscription
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [{price: priceId, quantity: 1}],
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: userEmail, // optional
            metadata,
            subscription_data: {metadata},

            automatic_tax: {enabled: true},
            tax_id_collection: {enabled: true},
        });

        if (!session.url) {
            console.error("Stripe session has no URL", session);
            return new Response(JSON.stringify({error: "Stripe session created without URL"}), {
                status: 500,
                headers: {"Content-Type": "application/json"},
            });
        }

        return new Response(JSON.stringify({url: session.url}), {
            status: 200,
            headers: {"Content-Type": "application/json"},
        });
    } catch (err) {
        console.error("Error in create-checkout-session:", err);
        return new Response(JSON.stringify({error: "Internal server error"}), {
            status: 500,
            headers: {"Content-Type": "application/json"},
        });
    }
});
