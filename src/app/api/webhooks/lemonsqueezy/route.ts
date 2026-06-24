import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import crypto from "crypto";
import { PLANS, type PlanId } from "@/app/api/checkout/route";

export const dynamic = "force-dynamic";

// ── Signature verification ──────────────────────────────────────────────────
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac   = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

// ── Webhook handler ─────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const body      = await req.text();
  const signature = req.headers.get("X-Signature") ?? "";
  const secret    = process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "";

  if (!secret) {
    logger.error("LEMONSQUEEZY_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  if (!verifySignature(body, signature, secret)) {
    logger.error("Lemon Squeezy webhook signature mismatch");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName: string = event?.meta?.event_name ?? "";
  const eventId:   string = String(event?.meta?.custom_data?.webhook_id ?? event?.data?.id ?? "");

  // ── Idempotency check ────────────────────────────────────────────────────
  if (eventId) {
    const existing = await prisma.paymentEvent.findUnique({ where: { id: eventId } });
    if (existing) {
      logger.info(`Idempotency skip for LS event: ${eventId}`);
      return NextResponse.json({ received: true, skipped: true });
    }
  }

  try {
    const attrs      = event?.data?.attributes ?? {};
    const customData = (attrs?.custom_data ?? event?.meta?.custom_data ?? {}) as Record<string, string>;
    const userId     = customData?.userId  as string | undefined;
    const planId     = customData?.planId  as PlanId | undefined;
    const chars      = parseInt(customData?.chars ?? "0", 10);

    switch (eventName) {
      // ── One-time purchase paid ─────────────────────────────────────────
      case "order_created": {
        if (attrs.status !== "paid") break;
        if (!userId || !planId) {
          logger.warn("order_created missing userId/planId custom_data", { eventId });
          break;
        }

        const plan = PLANS[planId];
        if (!plan) { logger.warn("Unknown planId", { planId }); break; }

        const receiptUrl = attrs?.urls?.receipt ?? null;

        await prisma.user.upsert({
          where:  { id: userId },
          create: { id: userId, email: `${userId}@local.dev`, name: "Sawti User" },
          update: {},
        });

        await prisma.subscription.upsert({
          where:  { userId },
          create: {
            userId,
            lsCustomerId: String(attrs.customer_id ?? ""),
            lsOrderId:    String(event.data.id),
            plan:         planId,
            status:       "active",
            receiptUrl,
            paidAt:       new Date(),
          },
          update: {
            plan:         planId,
            status:       "active",
            lsCustomerId: String(attrs.customer_id ?? ""),
            lsOrderId:    String(event.data.id),
            receiptUrl,
            paidAt:       new Date(),
          },
        });

        logger.info(`Plan activated via webhook: ${planId} for user ${userId}`);
        break;
      }

      // ── Subscription events (future-proofing for recurring billing) ────
      case "subscription_created":
      case "subscription_updated": {
        const lsCustomerId = String(attrs.customer_id ?? "");
        const status       = attrs.status === "active" ? "active" : attrs.status ?? "active";
        const periodEnd    = attrs.renews_at ? new Date(attrs.renews_at) : null;

        await prisma.subscription.updateMany({
          where: { lsCustomerId },
          data:  { status, currentPeriodEnd: periodEnd },
        });
        logger.info(`Subscription ${eventName} for LS customer ${lsCustomerId}`);
        break;
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        const lsCustomerId = String(attrs.customer_id ?? "");
        await prisma.subscription.updateMany({
          where: { lsCustomerId },
          data:  { status: "canceled", plan: "free" },
        });
        logger.info(`Subscription cancelled for LS customer ${lsCustomerId}`);
        break;
      }

      default:
        logger.info(`Unhandled LS event: ${eventName}`);
    }

    // Record event for idempotency
    if (eventId) {
      await prisma.paymentEvent.upsert({
        where:  { id: eventId },
        create: {
          id:         eventId,
          type:       eventName,
          planId:     planId ?? null,
          amount:     planId ? PLANS[planId as PlanId]?.amount / 100 : null,
        },
        update: {},
      });
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    logger.error("LS webhook DB error", { error: err.message });
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
