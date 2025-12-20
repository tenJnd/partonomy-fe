// supabase/functions/create-billing-portal-session/index.ts
import {serve} from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.48.0";

function requireEnv(name: string): string {
    const value = Deno.env.get(name);
    if (!value) throw new Error(`Missing env var: ${name}`);
    return value;
}

const STRIPE_SECRET_KEY = requireEnv("STRIPE_SECRET_KEY");
const SUPABASE_URL = requireEnv("SB_URL");
const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SB_SERVICE_ROLE_KEY");
const APP_URL = requireEnv("APP_URL");

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
});

const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

// Authed client: uses Authorization header from the request
function supabaseAuthedClient(req: Request) {
    const auth = req.headers.get("Authorization") ?? "";
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        global: {headers: {Authorization: auth}},
    });
}

// Admin client (no user context): only for reads we explicitly allow
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
    // CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", {headers: corsHeaders});
    }

    if (req.method !== "POST") {
        return new Response("Method not allowed", {status: 405, headers: corsHeaders});
    }

    try {
        // 1) Authenticate user (Verify JWT should be ON as well)
        const supabase = supabaseAuthedClient(req);
        const {data: userRes, error: userErr} = await supabase.auth.getUser();

        if (userErr || !userRes?.user) {
            return new Response(JSON.stringify({error: "Unauthorized"}), {
                status: 401,
                headers: {...corsHeaders, "Content-Type": "application/json"},
            });
        }

        const authedUserId = userRes.user.id;

        // 2) Parse input
        const body = await req.json();
        const {org_id, lang} = body as { org_id?: string; lang?: string };

        if (!org_id) {
            return new Response(JSON.stringify({error: "Missing org_id"}), {
                status: 400,
                headers: {...corsHeaders, "Content-Type": "application/json"},
            });
        }

        const safeLang = normalizeLang(lang);

        // 3) Authorization: ensure user belongs to the org (adjust this block to your schema)
        //
        // EXPECTED TABLE (example):
        // - organization_members: { org_id: uuid/text, user_id: uuid, role: text }
        //
        // If your membership table has a different name/columns, change ONLY this query.
        const {data: membership, error: membershipErr} = await supabaseAdmin
            .from("organization_members")
            .select("org_id,user_id,role")
            .eq("org_id", org_id)
            .eq("user_id", authedUserId)
            .maybeSingle();

        if (membershipErr) {
            console.error("Error checking org membership:", membershipErr);
            return new Response(JSON.stringify({error: "Failed to authorize user"}), {
                status: 500,
                headers: {...corsHeaders, "Content-Type": "application/json"},
            });
        }

        if (!membership) {
            return new Response(JSON.stringify({error: "Forbidden"}), {
                status: 403,
                headers: {...corsHeaders, "Content-Type": "application/json"},
            });
        }

        // Optional: enforce role-based access (e.g., owner/admin only)
        // const role = (membership as any).role as string | undefined;
        // if (role && role !== "owner" && role !== "admin") { ... }

        // 4) Load Stripe customer id for the org
        const {data: billing, error: billingError} = await supabaseAdmin
            .from("organization_billing")
            .select("stripe_customer_id")
            .eq("org_id", org_id)
            .maybeSingle();

        if (billingError) {
            console.error("Error fetching organization_billing:", billingError);
            return new Response(JSON.stringify({error: "Failed to load billing info"}), {
                status: 500,
                headers: {...corsHeaders, "Content-Type": "application/json"},
            });
        }

        if (!billing?.stripe_customer_id) {
            return new Response(JSON.stringify({error: "Organization has no Stripe customer"}), {
                status: 400,
                headers: {...corsHeaders, "Content-Type": "application/json"},
            });
        }

        const customerId = billing.stripe_customer_id as string;

        // 5) Return URL after closing portal
        const returnPath = `/${safeLang}/app/settings/billing`;
        const returnUrl = joinUrl(APP_URL, returnPath);

        // 6) Create Stripe Billing Portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });

        return new Response(JSON.stringify({url: session.url}), {
            status: 200,
            headers: {...corsHeaders, "Content-Type": "application/json"},
        });
    } catch (err) {
        console.error("Error in create-billing-portal-session:", err);
        return new Response(JSON.stringify({error: "Internal server error"}), {
            status: 500,
            headers: {...corsHeaders, "Content-Type": "application/json"},
        });
    }
});
