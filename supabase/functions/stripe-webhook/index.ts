// supabase/functions/stripe-webhook/index.ts
import {serve} from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.48.0";

function requireEnv(name: string): string {
    const v = Deno.env.get(name);
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
}

const STRIPE_SECRET_KEY = requireEnv("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = requireEnv("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = requireEnv("SB_URL");
const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SB_SERVICE_ROLE_KEY");

const stripe = new Stripe(STRIPE_SECRET_KEY, {apiVersion: "2024-06-20"});
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type TierCode = "trial" | "starter" | "pro" | "enterprise";

function unixToIso(unix: number | null | undefined): string | null {
    if (!unix) return null;
    return new Date(unix * 1000).toISOString();
}

async function findTierIdByCode(code: TierCode): Promise<string> {
    const {data, error} = await supabaseAdmin
        .from("organization_tiers")
        .select("id")
        .eq("code", code)
        .maybeSingle();

    if (error || !data?.id) {
        throw new Error(`Tier not found: ${code}. error=${JSON.stringify(error)}`);
    }
    return data.id;
}

async function resolveTierId(args: {
    overrideTierCode?: TierCode;
    subscription?: Stripe.Subscription | null;
}): Promise<{ tierCode: TierCode; tierId: string }> {
    const tierCode =
        args.overrideTierCode ??
        (args.subscription?.metadata?.tier as TierCode | undefined) ??
        "trial";

    const tierId = await findTierIdByCode(tierCode);
    return {tierCode, tierId};
}

/**
 * DB fallback mapping:
 * - Use stripe_subscription_id first
 * - Fallback to stripe_customer_id
 */
async function mapOrgIdFromDb(args: {
    stripeSubscriptionId?: string | null;
    stripeCustomerId?: string | null;
}): Promise<string | null> {
    const {stripeSubscriptionId, stripeCustomerId} = args;

    if (stripeSubscriptionId) {
        const {data, error} = await supabaseAdmin
            .from("organization_billing")
            .select("org_id")
            .eq("stripe_subscription_id", stripeSubscriptionId)
            .maybeSingle();
        if (!error && data?.org_id) return data.org_id as string;
    }

    if (stripeCustomerId) {
        const {data, error} = await supabaseAdmin
            .from("organization_billing")
            .select("org_id")
            .eq("stripe_customer_id", stripeCustomerId)
            .maybeSingle();
        if (!error && data?.org_id) return data.org_id as string;
    }

    return null;
}

/**
 * INVOICE helpers:
 * Stripe sometimes omits invoice.subscription, but provides:
 * - invoice.parent.subscription_details.subscription
 * - invoice.lines.data[0].parent.subscription_item_details.subscription
 * Also org_id is often present in nested metadata:
 * - invoice.parent.subscription_details.metadata.org_id
 * - invoice.lines.data[0].metadata.org_id
 */
function getInvoiceOrgId(invoice: Stripe.Invoice): string | null {
    const inv: any = invoice as any;

    const org1 = inv?.parent?.subscription_details?.metadata?.org_id;
    if (typeof org1 === "string" && org1.length) return org1;

    const org2 = inv?.lines?.data?.[0]?.metadata?.org_id;
    if (typeof org2 === "string" && org2.length) return org2;

    return null;
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
    const inv: any = invoice as any;

    if (typeof inv?.subscription === "string" && inv.subscription.length) return inv.subscription;

    const s1 = inv?.parent?.subscription_details?.subscription;
    if (typeof s1 === "string" && s1.length) return s1;

    const s2 = inv?.lines?.data?.[0]?.parent?.subscription_item_details?.subscription;
    if (typeof s2 === "string" && s2.length) return s2;

    return null;
}

function getInvoiceLinePeriod(invoice: Stripe.Invoice): { start: number | null; end: number | null } {
    const inv: any = invoice as any;
    const p = inv?.lines?.data?.[0]?.period;
    const start = typeof p?.start === "number" ? p.start : null;
    const end = typeof p?.end === "number" ? p.end : null;
    return {start, end};
}

function getInvoiceTierFromLines(invoice: Stripe.Invoice): TierCode | undefined {
    const inv: any = invoice as any;
    const t = inv?.lines?.data?.[0]?.metadata?.tier;
    if (t === "trial" || t === "starter" || t === "pro" || t === "enterprise") return t;
    return undefined;
}

/**
 * Extract IDs from event payload for stripe_webhook_events indexing.
 * For invoice events, also look into nested parent/lines for subscription id.
 */
function getIdsFromEvent(event: Stripe.Event): {
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripeInvoiceId: string | null;
} {
    const obj: any = event.data?.object;

    const stripeCustomerId = (obj?.customer as string | undefined) ?? null;

    let stripeSubscriptionId =
        (obj?.subscription as string | undefined) ??
        (event.type.startsWith("customer.subscription.") ? (obj?.id as string | undefined) ?? null : null);

    if (!stripeSubscriptionId && event.type.startsWith("invoice.")) {
        stripeSubscriptionId =
            obj?.parent?.subscription_details?.subscription ??
            obj?.lines?.data?.[0]?.parent?.subscription_item_details?.subscription ??
            null;
    }

    const stripeInvoiceId = event.type.startsWith("invoice.") ? (obj?.id as string | undefined) ?? null : null;

    return {stripeCustomerId, stripeSubscriptionId, stripeInvoiceId};
}

/**
 * Insert row for idempotence + fast debugging.
 * If duplicate -> return "duplicate".
 */
async function insertWebhookEventRow(args: {
    event: Stripe.Event;
    orgId: string | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripeInvoiceId: string | null;
}): Promise<"new" | "duplicate"> {
    const {event, orgId, stripeCustomerId, stripeSubscriptionId, stripeInvoiceId} = args;

    const requestId =
        (event as any)?.request?.id?.toString?.() ??
        (event as any)?.request?.id ??
        null;

    const stripeCreatedIso = unixToIso((event as any)?.created ?? null);

    const row: Record<string, unknown> = {
        event_id: event.id,
        event_type: event.type,
        livemode: event.livemode ?? false,
        stripe_created: stripeCreatedIso,
        request_id: requestId,
        org_id: orgId,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_invoice_id: stripeInvoiceId,
    };

    const {error} = await supabaseAdmin.from("stripe_webhook_events").insert(row);

    if (!error) return "new";

    const msg = (error as any)?.message?.toString?.() ?? "";
    const code = (error as any)?.code?.toString?.() ?? "";
    if (code === "23505" || msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique")) {
        return "duplicate";
    }

    // Never block billing processing due to logging failures
    console.error("stripe_webhook_events insert error (proceeding):", error);
    return "new";
}

async function ensureSubscriptionHasOrgMetadata(args: {
    subscriptionId: string;
    orgId: string;
    metadata?: Record<string, string> | null;
}) {
    const {subscriptionId, orgId, metadata} = args;

    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const current = (sub.metadata ?? {}) as Record<string, string>;

    if (current.org_id === orgId) return;

    await stripe.subscriptions.update(subscriptionId, {
        metadata: {...current, ...(metadata ?? {}), org_id: orgId},
    });
}

async function upsertOrganizationBilling(args: {
    orgId: string;
    subscription: Stripe.Subscription;
    overrideTierCode?: TierCode;
    sourceEventType: string;
    writePeriod: boolean;
    forceStatus?: string;
}) {
    const {orgId, subscription, overrideTierCode, sourceEventType, writePeriod, forceStatus} = args;

    const customerId = subscription.customer as string;
    const subId = subscription.id;

    const {tierId, tierCode} = await resolveTierId({overrideTierCode, subscription});

    const payload: Record<string, unknown> = {
        org_id: orgId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subId,
        tier_id: tierId,
        status: forceStatus ?? subscription.status,
    };

    if (writePeriod) {
        const cps = unixToIso(subscription.current_period_start);
        const cpe = unixToIso(subscription.current_period_end);
        if (cps) payload["current_period_start"] = cps;
        if (cpe) payload["current_period_end"] = cpe;
    }

    const {error} = await supabaseAdmin
        .from("organization_billing")
        .upsert(payload, {onConflict: "org_id"});

    if (error) {
        console.error("Error upserting organization_billing:", {
            orgId,
            subId,
            tierCode,
            writePeriod,
            sourceEventType,
            error,
        });
        throw error;
    }

    console.log("billing upsert ok", {
        orgId,
        subId,
        status: payload["status"],
        tierCode,
        writePeriod,
        sourceEventType,
    });
}

/**
 * Invoice fallback upsert when subscription retrieve is unavailable.
 * Uses invoice line period + customer/subscription ids from invoice payload.
 */
async function upsertBillingFromInvoiceFallback(args: {
    orgId: string;
    invoice: Stripe.Invoice;
    subscriptionId: string | null;
    forceStatus: string; // e.g. "active"
    sourceEventType: string;
}) {
    const {orgId, invoice, subscriptionId, forceStatus, sourceEventType} = args;

    const {start, end} = getInvoiceLinePeriod(invoice);
    const overrideTier = getInvoiceTierFromLines(invoice);

    const {tierId, tierCode} = await resolveTierId({overrideTierCode: overrideTier, subscription: null});

    const payload: Record<string, unknown> = {
        org_id: orgId,
        tier_id: tierId,
        status: forceStatus,
        stripe_customer_id: (invoice.customer as string | null) ?? null,
        stripe_subscription_id: subscriptionId,
    };

    if (start) payload["current_period_start"] = unixToIso(start);
    if (end) payload["current_period_end"] = unixToIso(end);

    const {error} = await supabaseAdmin
        .from("organization_billing")
        .upsert(payload, {onConflict: "org_id"});

    if (error) {
        console.error("Error upserting organization_billing from invoice fallback:", {
            orgId,
            subscriptionId,
            tierCode,
            sourceEventType,
            error,
        });
        throw error;
    }

    console.log("billing invoice-fallback upsert ok", {
        orgId,
        subscriptionId,
        tierCode,
        wrote_period_start: !!start,
        wrote_period_end: !!end,
        sourceEventType,
    });
}

serve(async (req) => {
    if (req.method !== "POST") return new Response("Method not allowed", {status: 405});

    const sig = req.headers.get("Stripe-Signature") ?? "";
    const raw = new Uint8Array(await req.arrayBuffer());
    const bodyText = new TextDecoder().decode(raw);

    let event: Stripe.Event;
    try {
        event = await stripe.webhooks.constructEventAsync(
            bodyText,
            sig,
            STRIPE_WEBHOOK_SECRET,
            undefined,
            cryptoProvider,
        );
    } catch (err) {
        console.error("❌ Webhook signature verification failed", err);
        return new Response("Bad signature", {status: 400});
    }

    const ids = getIdsFromEvent(event);

    // Best-effort orgId mapping BEFORE idempotency insert (so you can search by org_id)
    let orgId: string | null = null;
    try {
        const obj: any = event.data?.object;

        if (event.type === "checkout.session.completed") {
            orgId = (obj?.metadata?.org_id as string | undefined) ?? null;
        } else if (event.type.startsWith("customer.subscription.")) {
            orgId = (obj?.metadata?.org_id as string | undefined) ?? null;
        } else if (event.type.startsWith("invoice.")) {
            const invoice = event.data.object as Stripe.Invoice;

            // Prefer nested invoice metadata first
            orgId = getInvoiceOrgId(invoice);

            if (!orgId) {
                // fallback: map via DB
                orgId = await mapOrgIdFromDb({
                    stripeSubscriptionId: ids.stripeSubscriptionId,
                    stripeCustomerId: ids.stripeCustomerId,
                });
            }
        } else {
            orgId = (obj?.metadata?.org_id as string | undefined) ?? null;
            if (!orgId) {
                orgId = await mapOrgIdFromDb({
                    stripeSubscriptionId: ids.stripeSubscriptionId,
                    stripeCustomerId: ids.stripeCustomerId,
                });
            }
        }
    } catch (e) {
        console.warn("orgId mapping pre-insert failed (continuing):", e);
    }

    const idem = await insertWebhookEventRow({
        event,
        orgId,
        stripeCustomerId: ids.stripeCustomerId,
        stripeSubscriptionId: ids.stripeSubscriptionId,
        stripeInvoiceId: ids.stripeInvoiceId,
    });

    if (idem === "duplicate") {
        return new Response("ok (duplicate)", {status: 200});
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;

                const sessionOrgId = session.metadata?.org_id ?? null;
                const overrideTier = (session.metadata?.tier as TierCode | undefined) ?? undefined;

                console.log("checkout.session.completed", {
                    orgId: sessionOrgId,
                    subscription: session.subscription ?? null,
                    customer: session.customer ?? null,
                });

                if (!sessionOrgId || !session.subscription) break;

                const subscriptionId = session.subscription as string;

                // Since you set subscription_data.metadata in create-checkout-session,
                // this should exist. Keep as safety.
                await ensureSubscriptionHasOrgMetadata({
                    subscriptionId,
                    orgId: sessionOrgId,
                    metadata: session.metadata ?? null,
                });

                const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                // Baseline upsert only (no period, no claim of paid)
                await upsertOrganizationBilling({
                    orgId: sessionOrgId,
                    subscription,
                    overrideTierCode: overrideTier,
                    sourceEventType: event.type,
                    writePeriod: false,
                });

                break;
            }

            case "invoice.paid": {
                const invoice = event.data.object as Stripe.Invoice;

                // Robust extraction
                const subscriptionId = getInvoiceSubscriptionId(invoice);
                const orgIdFromInvoice = getInvoiceOrgId(invoice);

                console.log("invoice.paid", {
                    invoiceId: invoice.id,
                    subscriptionId,
                    orgIdFromInvoice,
                    customer: invoice.customer ?? null,
                });

                let resolvedOrgId = orgIdFromInvoice;

                if (!resolvedOrgId) {
                    resolvedOrgId = await mapOrgIdFromDb({
                        stripeSubscriptionId: subscriptionId,
                        stripeCustomerId: (invoice.customer as string | null) ?? null,
                    });
                }

                if (!resolvedOrgId) {
                    console.warn("invoice.paid: cannot map org_id", {invoiceId: invoice.id, subscriptionId});
                    break;
                }

                if (subscriptionId) {
                    try {
                        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                        await upsertOrganizationBilling({
                            orgId: resolvedOrgId,
                            subscription,
                            sourceEventType: event.type,
                            writePeriod: true, // ✅ only authoritative write
                        });

                        break;
                    } catch (e) {
                        console.warn("invoice.paid: cannot retrieve subscription, falling back to invoice line period", {
                            subscriptionId,
                            invoiceId: invoice.id,
                        });
                        // fall through to invoice fallback
                    }
                }

                // Fallback: use invoice line period (start/end) + ids from invoice
                await upsertBillingFromInvoiceFallback({
                    orgId: resolvedOrgId,
                    invoice,
                    subscriptionId,
                    forceStatus: "active",
                    sourceEventType: event.type,
                });

                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;

                const subscriptionId = getInvoiceSubscriptionId(invoice);
                const orgIdFromInvoice = getInvoiceOrgId(invoice);

                console.log("invoice.payment_failed", {
                    invoiceId: invoice.id,
                    subscriptionId,
                    orgIdFromInvoice,
                    customer: invoice.customer ?? null,
                });

                let resolvedOrgId = orgIdFromInvoice;

                if (!resolvedOrgId) {
                    resolvedOrgId = await mapOrgIdFromDb({
                        stripeSubscriptionId: subscriptionId,
                        stripeCustomerId: (invoice.customer as string | null) ?? null,
                    });
                }

                if (!resolvedOrgId) {
                    console.warn("invoice.payment_failed: cannot map org_id", {invoiceId: invoice.id, subscriptionId});
                    break;
                }

                if (subscriptionId) {
                    try {
                        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                        await upsertOrganizationBilling({
                            orgId: resolvedOrgId,
                            subscription,
                            sourceEventType: event.type,
                            writePeriod: false, // ✅ never touch period on failure
                        });

                        break;
                    } catch (e) {
                        console.warn("invoice.payment_failed: cannot retrieve subscription, doing minimal update", {
                            subscriptionId,
                            invoiceId: invoice.id,
                        });
                    }
                }

                // Minimal fallback: do NOT write period on failures
                // Ensure tier_id exists; status set to past_due-ish
                const overrideTier = getInvoiceTierFromLines(invoice);
                const {tierId} = await resolveTierId({overrideTierCode: overrideTier, subscription: null});

                const payload: Record<string, unknown> = {
                    org_id: resolvedOrgId,
                    tier_id: tierId,
                    status: "past_due",
                    stripe_customer_id: (invoice.customer as string | null) ?? null,
                    stripe_subscription_id: subscriptionId,
                };

                const {error} = await supabaseAdmin
                    .from("organization_billing")
                    .upsert(payload, {onConflict: "org_id"});

                if (error) throw error;

                break;
            }

            case "customer.subscription.deleted": {
                const subLite = event.data.object as Stripe.Subscription;
                const subscriptionId = subLite.id;

                let resolvedOrgId = (subLite.metadata?.org_id as string | undefined) ?? null;
                if (!resolvedOrgId) {
                    resolvedOrgId = await mapOrgIdFromDb({
                        stripeSubscriptionId: subscriptionId,
                        stripeCustomerId: (subLite.customer as string | null) ?? null,
                    });
                }

                console.log("customer.subscription.deleted", {
                    orgId: resolvedOrgId,
                    subscriptionId,
                    status: subLite.status,
                });

                if (!resolvedOrgId) break;

                // Retrieve canonical subscription (optional but consistent)
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                await upsertOrganizationBilling({
                    orgId: resolvedOrgId,
                    subscription,
                    sourceEventType: event.type,
                    writePeriod: false,
                    forceStatus: "canceled",
                });

                break;
            }

            // Optional baseline sync (no period)
            case "customer.subscription.created":
            case "customer.subscription.updated": {
                const subLite = event.data.object as Stripe.Subscription;

                let resolvedOrgId = (subLite.metadata?.org_id as string | undefined) ?? null;
                if (!resolvedOrgId) {
                    resolvedOrgId = await mapOrgIdFromDb({
                        stripeSubscriptionId: subLite.id,
                        stripeCustomerId: (subLite.customer as string | null) ?? null,
                    });
                }

                console.log(event.type, {
                    orgId: resolvedOrgId,
                    subscriptionId: subLite.id,
                    status: subLite.status,
                });

                if (!resolvedOrgId) break;

                const subscription = await stripe.subscriptions.retrieve(subLite.id);

                await upsertOrganizationBilling({
                    orgId: resolvedOrgId,
                    subscription,
                    sourceEventType: event.type,
                    writePeriod: false,
                });

                break;
            }

            default:
                break;
        }

        return new Response("ok", {status: 200});
    } catch (err) {
        console.error("Error in webhook handler:", err);
        return new Response("Internal error", {status: 500});
    }
});
