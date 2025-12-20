// supabase/functions/stripe-webhook/index.ts
import {serve} from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.48.0";

function requireEnv(name: string): string {
    const value = Deno.env.get(name);
    if (!value) throw new Error(`Missing env var: ${name}`);
    return value;
}

const STRIPE_SECRET_KEY = requireEnv("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = requireEnv("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = requireEnv("SB_URL");
const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SB_SERVICE_ROLE_KEY");

const stripe = new Stripe(STRIPE_SECRET_KEY, {apiVersion: "2024-06-20"});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type TierCode = "trial" | "starter" | "pro" | "enterprise";
type Period = "monthly" | "yearly";
type Currency = "USD" | "EUR";

async function findTierIdByCode(code: TierCode | undefined): Promise<string | null> {
    if (!code) return null;

    const {data, error} = await supabaseAdmin
        .from("organization_tiers")
        .select("id")
        .eq("code", code)
        .maybeSingle();

    if (error) {
        console.error("Error fetching tier row:", error);
        return null;
    }

    return data?.id ?? null;
}

function unixToIso(unix: number | null | undefined): string | null {
    if (!unix) return null;
    return new Date(unix * 1000).toISOString();
}

async function upsertOrganizationBillingFromSubscription(args: {
    orgId: string;
    subscription: Stripe.Subscription;
    overrideTierCode?: TierCode | undefined;
}) {
    const {orgId, subscription, overrideTierCode} = args;

    const customerId = subscription.customer as string;
    const subId = subscription.id;
    const status = subscription.status;

    const currentPeriodStart = unixToIso(subscription.current_period_start);
    const currentPeriodEnd = unixToIso(subscription.current_period_end);

    const tierCode = overrideTierCode ?? (subscription.metadata?.tier as TierCode | undefined);
    const tierId = await findTierIdByCode(tierCode);

    const payload: Record<string, unknown> = {
        org_id: orgId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subId,
        status,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
    };

    if (tierId) payload["tier_id"] = tierId;

    const {error} = await supabaseAdmin
        .from("organization_billing")
        .upsert(payload, {onConflict: "org_id"});

    if (error) console.error("Error upserting organization_billing:", error);
}

/**
 * Idempotency guard: insert event_id into stripe_webhook_events.
 * If already exists => treat as duplicate and exit 200.
 */
async function markEventProcessed(event: Stripe.Event): Promise<"new" | "duplicate"> {
    const {error} = await supabaseAdmin
        .from("stripe_webhook_events")
        .insert({event_id: event.id, event_type: event.type});

    if (!error) return "new";

    // Postgres unique violation => already processed
    // Supabase error codes can vary; safest is to treat conflict-like errors as duplicate if message indicates it.
    const msg = (error as any)?.message?.toString?.() ?? "";
    const code = (error as any)?.code?.toString?.() ?? "";

    if (code === "23505" || msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique")) {
        return "duplicate";
    }

    // Unknown error: we log but proceed to avoid dropping billing state updates (you can choose to fail hard instead).
    console.error("Idempotency insert error (proceeding anyway):", error);
    return "new";
}

serve(async (req) => {
    // Stripe sends POST only; respond 405 otherwise
    if (req.method !== "POST") return new Response("Method not allowed", {status: 405});

    const sig = req.headers.get("Stripe-Signature") ?? "";

    // Read raw bytes and decode. Safer for signature verification than req.text() in edge cases.
    const raw = new Uint8Array(await req.arrayBuffer());
    const bodyText = new TextDecoder().decode(raw);

    let event: Stripe.Event;

    try {
        event = await stripe.webhooks.constructEventAsync(
            bodyText,
            sig,
            STRIPE_WEBHOOK_SECRET,
            undefined, // default tolerance
            cryptoProvider,
        );
    } catch (err) {
        console.error("❌ Webhook signature verification failed", err);
        return new Response("Bad signature", {status: 400});
    }

    // Idempotency guard
    const idem = await markEventProcessed(event);
    if (idem === "duplicate") {
        return new Response("ok (duplicate)", {status: 200});
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;

                const orgId = session.metadata?.org_id;
                const tier = session.metadata?.tier as TierCode | undefined;
                const period = session.metadata?.period as Period | undefined;
                const currency = session.metadata?.currency as Currency | undefined;

                console.log("checkout.session.completed", {
                    orgId,
                    tier,
                    period,
                    currency,
                    subscription: session.subscription,
                });

                if (!orgId || !session.subscription) {
                    console.warn("Missing orgId or subscription in session.completed");
                    break;
                }

                const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

                await upsertOrganizationBillingFromSubscription({
                    orgId,
                    subscription,
                    overrideTierCode: tier,
                });

                // Optional: store org/tier/period/currency on Customer for easier debugging in Stripe UI
                const customerId = subscription.customer as string;
                const md = session.metadata ?? {};
                await stripe.customers.update(customerId, {metadata: md});

                break;
            }

            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const orgId = subscription.metadata?.org_id as string | undefined;

                console.log(`subscription lifecycle: ${event.type}`, {
                    orgId,
                    subscription_id: subscription.id,
                    status: subscription.status,
                });

                if (!orgId) {
                    console.warn("Subscription lifecycle event without org_id in metadata");
                    break;
                }

                await upsertOrganizationBillingFromSubscription({orgId, subscription});
                break;
            }

            case "invoice.payment_failed":
            case "invoice.paid": {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = invoice.subscription as string | null;

                console.log(event.type, {
                    subscriptionId,
                    customer: invoice.customer,
                });

                if (!subscriptionId) break;

                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const orgId = subscription.metadata?.org_id as string | undefined;

                if (!orgId) break;

                await upsertOrganizationBillingFromSubscription({
                    orgId,
                    subscription,
                });

                break;
            }

            default:
                // ignore other events
                break;
        }

        return new Response("ok", {status: 200});
    } catch (err) {
        console.error("Error in webhook handler:", err);
        // Important: 500 causes Stripe retries (good if transient error). Keep it.
        return new Response("Internal error", {status: 500});
    }
});
