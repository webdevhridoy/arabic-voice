import { NextRequest, NextResponse } from "next/server";
import { createCheckout } from "@/lib/lemonsqueezy";
import { auth } from "@clerk/nextjs/server";

// ── Plan definitions ────────────────────────────────────────────────────────
// amount is in USD cents (for display/DB consistency with old Stripe setup)
// variantId comes from LEMONSQUEEZY_VARIANT_* env vars set in dashboard
export const PLANS = {
  starter: {
    name:      "Starter",
    amount:    499,        // $4.99
    chars:     100_000,
    label:     "100,000 characters",
    minutes:   "~120 minutes",
    variantId: process.env.LEMONSQUEEZY_VARIANT_STARTER || "",
  },
  pro: {
    name:      "Pro",
    amount:    999,        // $9.99
    chars:     300_000,
    label:     "300,000 characters",
    minutes:   "~360 minutes",
    variantId: process.env.LEMONSQUEEZY_VARIANT_PRO || "",
  },
  power: {
    name:      "Power",
    amount:    1999,       // $19.99
    chars:     1_000_000,
    label:     "1,000,000 characters",
    minutes:   "~1,200 minutes",
    variantId: process.env.LEMONSQUEEZY_VARIANT_POWER || "",
  },
} as const;

export type PlanId = keyof typeof PLANS;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = (await req.json()) as { planId: PlanId };
    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    if (!storeId || !plan.variantId) {
      return NextResponse.json(
        { error: "Payment provider not configured" },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      req.nextUrl.origin ||
      "http://localhost:3000";

    // Create a Lemon Squeezy checkout session
    const { data, error } = await createCheckout(storeId, plan.variantId, {
      checkoutOptions: {
        embed: false,
        media: false,
      },
      checkoutData: {
        // Pass userId + planId so we can verify on the success redirect
        custom: {
          userId,
          planId,
          chars: String(plan.chars),
        },
      },
      productOptions: {
        name: `Sawti ${plan.name} Pack`,
        description: `${plan.label} · ${plan.minutes} من الصوت العربي`,
        redirectUrl: `${baseUrl}/api/checkout/success`,
        receiptButtonText: "Go to Dashboard",
        receiptThankYouNote:
          "Thank you for your purchase! Your characters are now active.",
      },
      expiresAt: null,
    });

    if (error || !data?.data?.attributes?.url) {
      console.error("Lemon Squeezy checkout error:", error);
      return NextResponse.json(
        { error: error?.message || "Failed to create checkout" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.data.attributes.url });
  } catch (err: any) {
    console.error("Checkout error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
