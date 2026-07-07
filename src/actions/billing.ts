"use server";

import { prisma } from "@/lib/prisma";
import { checkUsageLimit } from "@/lib/usage";
import { PLANS } from "@/app/api/checkout/route";

import { auth } from "@clerk/nextjs/server";

export async function getBillingData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [subscription, invoices, usageRecords, usage] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),

    // Invoices = all paid payment events (order_created)
    prisma.paymentEvent.findMany({
      where:   { type: "order_created" },
      orderBy: { createdAt: "desc" },
      take:    20,
    }),

    prisma.usageRecord.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
      take:    20,
    }),

    checkUsageLimit(userId, 0),
  ]);

  const planId  = (subscription?.plan ?? "free") as keyof typeof PLANS | "free";
  const planDef = planId !== "free" ? PLANS[planId as keyof typeof PLANS] : null;

  return {
    subscription,
    planId,
    planDef,
    invoices,
    usageRecords,
    usage,
  };
}

export async function getCustomerPortalUrl() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  
  // Base unsigned portal URL in case retrieval fails or no customer exists yet
  const fallbackUrl = "https://sawti.lemonsqueezy.com/billing";

  if (!subscription || !subscription.lsCustomerId) {
    return fallbackUrl;
  }

  try {
    const res = await fetch(`https://api.lemonsqueezy.com/v1/customers/${subscription.lsCustomerId}`, {
      headers: {
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        "Authorization": `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      },
      next: { revalidate: 0 } // Do not cache customer portal URLs which expire
    });

    if (!res.ok) {
      console.error("Failed to fetch customer from Lemon Squeezy:", await res.text());
      return fallbackUrl;
    }

    const json = await res.json();
    const portalUrl = json?.data?.attributes?.urls?.customer_portal;
    return portalUrl || fallbackUrl;
  } catch (err) {
    console.error("Error retrieving Lemon Squeezy portal URL:", err);
    return fallbackUrl;
  }
}
