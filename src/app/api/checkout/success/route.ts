import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "@/lib/lemonsqueezy";
import { prisma } from "@/lib/prisma";
import { PLANS, type PlanId } from "../route";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Lemon Squeezy redirects back with ?order_id=xxx
  const orderId = req.nextUrl.searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.redirect(
      new URL("/dashboard?error=missing_order", req.url)
    );
  }

  try {
    // Retrieve + verify the order from Lemon Squeezy
    const { data: orderData, error } = await getOrder(orderId);

    if (error || !orderData) {
      console.error("LS order fetch error:", error);
      return NextResponse.redirect(
        new URL("/dashboard?error=order_not_found", req.url)
      );
    }

    const order = orderData.data;
    const attrs = order.attributes;

    // Verify the order was actually paid
    if (attrs.status !== "paid") {
      return NextResponse.redirect(
        new URL("/dashboard?error=not_paid", req.url)
      );
    }

    // Extract our custom data that we passed at checkout creation
    const firstItem   = (attrs.first_order_item as any) ?? null;
    const customData  = (firstItem?.custom_data
      ?? (attrs as any).custom_data
      ?? {}) as Record<string, string>;

    const userId  = customData?.userId  as string | undefined;
    const planId  = customData?.planId  as PlanId | undefined;
    const chars   = parseInt(customData?.chars || "0", 10);

    if (!userId || !planId || !chars) {
      // Fallback: still a paid order — log and redirect gracefully
      console.error("Missing custom_data on LS order", orderId);
      return NextResponse.redirect(
        new URL("/dashboard?error=bad_metadata", req.url)
      );
    }

    const plan       = PLANS[planId];
    const receiptUrl = attrs.urls?.receipt ?? null;
    const now        = new Date();

    // 1. Ensure User record exists (idempotent)
    await prisma.user.upsert({
      where:  { id: userId },
      create: { id: userId, email: `${userId}@local.dev`, name: "Local User" },
      update: {},
    });

    // 2. Ensure Plan record exists with correct char limit
    const existingPlan = await prisma.plan.findFirst({ where: { name: planId } });
    if (existingPlan) {
      await prisma.plan.update({
        where: { id: existingPlan.id },
        data:  { characterLimit: chars, monthlyPrice: plan.amount / 100 },
      });
    } else {
      await prisma.plan.create({
        data: { name: planId, monthlyPrice: plan.amount / 100, characterLimit: chars },
      });
    }

    // 3. Upsert Subscription with Lemon Squeezy order details
    await prisma.subscription.upsert({
      where:  { userId },
      create: {
        userId,
        lsCustomerId: String(attrs.customer_id ?? ""),
        lsOrderId:    String(order.id),
        plan:         planId,
        status:       "active",
        receiptUrl,
        paidAt:       now,
      },
      update: {
        plan:         planId,
        status:       "active",
        lsCustomerId: String(attrs.customer_id ?? ""),
        lsOrderId:    String(order.id),
        receiptUrl,
        paidAt:       now,
      },
    });

    // 4. Idempotency — store payment event
    await prisma.paymentEvent.upsert({
      where:  { id: String(order.id) },
      create: {
        id:         String(order.id),
        type:       "order_created",
        planId,
        amount:     plan.amount / 100,
        receiptUrl,
      },
      update: {},
    });

    return NextResponse.redirect(
      new URL(`/dashboard/billing?upgraded=true&plan=${planId}`, req.url)
    );
  } catch (err: any) {
    console.error("Checkout success error:", err.message);
    return NextResponse.redirect(new URL("/dashboard?error=server", req.url));
  }
}
