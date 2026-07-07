import { NextRequest, NextResponse } from "next/server";
import { PLANS, type PlanId } from "@/app/api/checkout/route";
import { createCheckout } from "@/lib/lemonsqueezy";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      // If not logged in, redirect to sign-up
      return NextResponse.redirect(new URL("/sign-up", req.url));
    }

    const { searchParams } = new URL(req.url);
    const planId = searchParams.get("plan") as PlanId;
    const plan = PLANS[planId];
    
    if (!plan) {
      console.warn("Redirect checkout: Invalid or missing planId:", planId);
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    if (!storeId || !plan.variantId) {
      console.error("Redirect checkout: Lemon Squeezy Store ID or variant ID not configured");
      return NextResponse.redirect(new URL("/dashboard", req.url));
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
      console.error("Lemon Squeezy redirect checkout error:", error);
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Redirect directly to Lemon Squeezy checkout
    return NextResponse.redirect(data.data.attributes.url);
  } catch (err: any) {
    console.error("Checkout redirect handler error:", err.message);
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
}
