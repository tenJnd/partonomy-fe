// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

// ENV proměnné (pozor: v .env.local bez prefixu SUPABASE_)
const STRIPE_SECRET_KEY = requireEnv("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = requireEnv("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = requireEnv("SB_URL");
const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SB_SERVICE_ROLE_KEY");

// Stripe klient + WebCrypto provider pro Edge/Deno
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

// Supabase admin klient (service role)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Typy podle tvého billing modelu
type TierCode = "trial" | "starter" | "pro" | "enterprise";
type Period = "monthly" | "yearly";
type Currency = "USD" | "EUR";

async function findTierIdByCode(code: TierCode | undefined): Promise<string | null> {
  if (!code) return null;

  const { data, error } = await supabaseAdmin
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
  const { orgId, subscription, overrideTierCode } = args;

  const customerId = subscription.customer as string;
  const subId = subscription.id;
  const status = subscription.status;

  const currentPeriodStart = unixToIso(subscription.current_period_start);
  const currentPeriodEnd = unixToIso(subscription.current_period_end);

  const tierCode =
    overrideTierCode ??
    (subscription.metadata?.tier as TierCode | undefined);

  const tierId = await findTierIdByCode(tierCode);

  const payload: Record<string, unknown> = {
    org_id: orgId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subId,
    status,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
  };

  if (tierId) {
    payload["tier_id"] = tierId;
  }

  const { error } = await supabaseAdmin
    .from("organization_billing")
    .upsert(payload, { onConflict: "org_id" });

  if (error) {
    console.error("Error upserting organization_billing:", error);
  }
}

serve(async (req) => {
  const sig = req.headers.get("Stripe-Signature") ?? "";
  const bodyText = await req.text();

  let event: Stripe.Event;

  try {
    // DŮLEŽITÉ: async verze + cryptoProvider pro WebCrypto v edge runtime
    event = await stripe.webhooks.constructEventAsync(
      bodyText,
      sig,
      STRIPE_WEBHOOK_SECRET,
      undefined,       // tolerance (default)
      cryptoProvider,  // WebCrypto provider
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed", err);
    return new Response("Bad signature", { status: 400 });
  }

  try {
    // 1) checkout.session.completed – po úspěšném checkoutu vytvoří/aktualizuje billing
    if (event.type === "checkout.session.completed") {
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
        return new Response("ok", { status: 200 });
      }

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
      );

      await upsertOrganizationBillingFromSubscription({
        orgId,
        subscription,
        overrideTierCode: tier,
      });

      // Volitelně: metadata i na Customer kvůli UI
      const customerId = subscription.customer as string;
      await stripe.customers.update(customerId, {
        metadata: {
          ...(subscription.metadata || {}),
          org_id: orgId,
          tier,
          period,
          currency,
        },
      });
    }

    // 2) Subscription lifecycle – změny tarifu, zrušení, atd.
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const orgId = subscription.metadata?.org_id as string | undefined;

      console.log(`subscription lifecycle event: ${event.type}`, {
        orgId,
        subscription_id: subscription.id,
        status: subscription.status,
      });

      if (!orgId) {
        console.warn(
          "Subscription lifecycle event without org_id in metadata",
        );
        return new Response("ok", { status: 200 });
      }

      await upsertOrganizationBillingFromSubscription({
        orgId,
        subscription,
      });
    }

    // 3) invoice.payment_failed – můžeš nastavit status na "past_due"
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string | null;

      console.log("invoice.payment_failed", {
        subscriptionId,
        customer: invoice.customer,
      });

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const orgId = subscription.metadata?.org_id as string | undefined;

        if (orgId) {
          const { error } = await supabaseAdmin
            .from("organization_billing")
            .update({
              status: "past_due",
            })
            .eq("org_id", orgId);

          if (error) {
            console.error(
              "Error updating organization_billing on payment_failed:",
              error,
            );
          }
        }
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Error in webhook handler:", err);
    return new Response("Internal error", { status: 500 });
  }
});
