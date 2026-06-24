# Production Environment Keys Guide - Sawti (صوتي)

To deploy the **Sawti (صوتي) Arabic Text to Speech AI SaaS** application to production/live servers, we need to configure several API keys and cloud services. 

Please locate and provide the keys detailed in this guide.

---

## 1. Authentication (Clerk)
We use Clerk for securing accounts and user sign-ins.
* **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`**
* **`CLERK_SECRET_KEY`**

### How to get them:
1. Log in to your [Clerk Dashboard](https://dashboard.clerk.com).
2. Create/select your production project.
3. In the left menu, go to **API Keys**.
4. Copy the **Publishable key** and **Secret key**.

---

## 2. Text-to-Speech Engine (ElevenLabs)
This generates high-quality Arabic voices from the provided text inputs.
* **`ELEVENLABS_API_KEY`**

### How to get it:
1. Log in to your [ElevenLabs Dashboard](https://elevenlabs.io).
2. Click on your profile picture in the bottom-left corner and select **Profile + API Keys** (or go to [https://elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys)).
3. Click the eye icon next to the API key to reveal and copy it.

---

## 3. Cloud File Storage (Supabase)
This stores the generated `.mp3` files so users can listen to or download them.
* **`SUPABASE_URL`**
* **`SUPABASE_SERVICE_ROLE_KEY`**
* **`SUPABASE_STORAGE_BUCKET`** *(e.g., "audio-files")*

### How to get them:
1. Log in to [Supabase](https://supabase.com).
2. Go to your Project **Settings** -> **API**.
3. Under API Settings:
   - Copy the **Project URL** (this is `SUPABASE_URL`).
   - Copy the **`service_role` key** (this is `SUPABASE_SERVICE_ROLE_KEY` — **do not** use the public `anon` key, as the backend needs write access).
4. Go to **Storage** in the left sidebar and create a bucket (e.g. `audio-files`). Make sure the bucket is marked as **Public** (so public URLs can stream/download the generated audio), and copy the bucket name (this is `SUPABASE_STORAGE_BUCKET`).

---

## 4. Persistent Database (PostgreSQL)
The application stores users, subscriptions, limits, and usage logs.
* **`DATABASE_URL`**

### How to get it:
- If using **Supabase** (recommended, since we already use it for Storage):
  1. Go to Project **Settings** -> **Database**.
  2. Scroll down to **Connection string** -> Choose **URI** (Transaction pooler or Direct).
  3. Copy the URL and replace `[YOUR-PASSWORD]` with your actual database password.
- If using another service like **Neon** or **Railway**:
  1. Create a PostgreSQL database instance.
  2. Copy the database connection URI.

---

## 5. Background Task Queue (Redis)
We use a Redis queue (via BullMQ) to safely manage text-to-speech requests in the background without slowing down the site.
* **`REDIS_URL`**

### How to get it:
1. Sign up for a Redis provider like **Upstash** (highly recommended for serverless) or **Redis Labs**.
2. Create a Redis database instance.
3. Copy the connection URI. For Upstash, it will look like `rediss://default:xxxxxx@xxxxxx.upstash.io:6379`.

---

## 6. Payments & Credits (Lemon Squeezy) - *Optional*
Required if you want to charge users for credits/packages.
* **`LEMONSQUEEZY_API_KEY`**
* **`LEMONSQUEEZY_STORE_ID`**
* **`LEMONSQUEEZY_WEBHOOK_SECRET`**
* **`LEMONSQUEEZY_VARIANT_STARTER`**
* **`LEMONSQUEEZY_VARIANT_PRO`**
* **`LEMONSQUEEZY_VARIANT_POWER`**

### How to get them:
1. Log in to your [Lemon Squeezy Dashboard](https://app.lemonsqueezy.com).
2. Go to **Settings** -> **API** to generate your `LEMONSQUEEZY_API_KEY`.
3. Locate your Store ID in settings or the dashboard URL/sidebar (this is `LEMONSQUEEZY_STORE_ID`).
4. Go to **Store** -> **Products** and create your products (Starter, Pro, Power).
5. Copy the Variant ID for each variant (these are `LEMONSQUEEZY_VARIANT_STARTER`, `LEMONSQUEEZY_VARIANT_PRO`, and `LEMONSQUEEZY_VARIANT_POWER`).
6. Go to **Settings** -> **Webhooks**:
   - Add a webhook endpoint pointing to `https://your-production-domain.com/api/webhooks/lemonsqueezy`.
   - Select the events to listen to (e.g. `order_created`, `subscription_created`, etc.).
   - Set a signing secret (this is `LEMONSQUEEZY_WEBHOOK_SECRET`).

---

## 7. App Configuration
* **`NEXT_PUBLIC_BASE_URL`**: The live URL of the application (e.g. `https://your-app.vercel.app` or `https://your-custom-domain.com`).
* **`ADMIN_USER_IDS`**: Comma-separated list of Clerk user IDs for administrators who should have admin dashboard access.
