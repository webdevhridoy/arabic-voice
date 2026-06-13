import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

import { auth } from "@clerk/nextjs/server";

// Plan definitions — price in cents, chars granted
export const PLANS = {
  starter: {
    name:      "Starter",
    amount:    499,       // $4.99
    chars:     100_000,
    label:     "100,000 characters",
    minutes:   "~120 minutes",
  },
  pro: {
    name:      "Pro",
    amount:    999,       // $9.99
    chars:     300_000,
    label:     "300,000 characters",
    minutes:   "~360 minutes",
  },
  power: {
    name:      "Power",
    amount:    1999,      // $19.99
    chars:     1_000_000,
    label:     "1,000,000 characters",
    minutes:   "~1,200 minutes",
  },
} as const;

export type PlanId = keyof typeof PLANS;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { planId } = await req.json() as { planId: PlanId };

    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: userId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: plan.amount,
            product_data: {
              name: `Sawti ${plan.name} Pack`,
              description: `${plan.label} · ${plan.minutes} من الصوت العربي`,
              images: [],
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId,
        planId,
        chars: String(plan.chars),
      },
      success_url: `${baseUrl}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
