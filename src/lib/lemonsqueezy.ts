import { lemonSqueezySetup, createCheckout, getOrder } from "@lemonsqueezy/lemonsqueezy.js";

// Initialize the SDK once at module load
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY || "",
  onError(error) {
    console.error("Lemon Squeezy error:", error);
  },
});

export { createCheckout, getOrder };
