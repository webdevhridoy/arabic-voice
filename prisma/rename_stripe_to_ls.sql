-- Rename Stripe-specific columns to provider-agnostic names
ALTER TABLE "Subscription" RENAME COLUMN "stripeCustomerId" TO "lsCustomerId";
ALTER TABLE "Subscription" RENAME COLUMN "stripeSubscriptionId" TO "lsOrderId";

-- Rename the StripeEvent table to PaymentEvent
ALTER TABLE "StripeEvent" RENAME TO "PaymentEvent";
