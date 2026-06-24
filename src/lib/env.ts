import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().optional().default("file:./prisma/dev.db"),
  LEMONSQUEEZY_API_KEY:          z.string().optional(),
  LEMONSQUEEZY_STORE_ID:         z.string().optional(),
  LEMONSQUEEZY_WEBHOOK_SECRET:   z.string().optional(),
  LEMONSQUEEZY_VARIANT_STARTER:  z.string().optional(),
  LEMONSQUEEZY_VARIANT_PRO:      z.string().optional(),
  LEMONSQUEEZY_VARIANT_POWER:    z.string().optional(),
  // Optional in dev — app will still run but TTS will fail at generation time
  ELEVENLABS_API_KEY: z.string().optional().default(""),
  GROQ_API_KEY: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  REDIS_URL: z.string().optional(),
  ADMIN_USER_IDS: z.string().default(""), // Comma-separated
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_BASE_URL: z.string().optional(),
});

/**
 * Evaluates the process.env securely.
 * Automatically crashes process at boot if configured incorrectly!
 */
export const env = {
  server: {},
  client: {}
} as {
  server: z.infer<typeof serverSchema>;
  client: z.infer<typeof clientSchema>;
};

export function validateEnv() {
  const parsedServer = serverSchema.safeParse(process.env);
  const parsedClient = clientSchema.safeParse({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  });

  if (!parsedServer.success || !parsedClient.success) {
    console.error("❌ Invalid environment variables:");
    if (!parsedServer.success) {
      console.error(parsedServer.error.flatten().fieldErrors);
    }
    if (!parsedClient.success) {
      console.error(parsedClient.error.flatten().fieldErrors);
    }
    // In development, warn but don't crash so the UI can still be developed
    if (process.env.NODE_ENV !== "development") {
      throw new Error("Invalid environment variables");
    }
    return;
  }

  // Bind to singleton
  env.server = parsedServer.data;
  env.client = parsedClient.data;

  // Warn if ElevenLabs key is missing
  if (!env.server.ELEVENLABS_API_KEY) {
    console.warn("⚠️  ELEVENLABS_API_KEY is not set. TTS generation will fail until you add it to .env.local");
  }
}

// Automatically runs explicitly when imported (for Node modules like Worker/API)
validateEnv();
