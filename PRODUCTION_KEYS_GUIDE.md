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

## 6. Payments & Subscriptions (Stripe) - *Optional*
Required if you want to charge users for credits/subscriptions.
* **`STRIPE_SECRET_KEY`**
* **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`**
* **`STRIPE_WEBHOOK_SECRET`**

### How to get them:
1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com).
2. Under **Developers** -> **API Keys**:
   - Copy the **Publishable key** (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).
   - Copy the **Secret key** (`STRIPE_SECRET_KEY`).
3. Under **Developers** -> **Webhooks**:
   - Add an endpoint pointing to `https://your-production-domain.com/api/webhooks/stripe`.
   - Select the events to listen to (e.g. `checkout.session.completed`, `customer.subscription.updated`, etc.).
   - Copy the **Signing secret** (this is `STRIPE_WEBHOOK_SECRET`).

---

## 7. App Configuration
* **`NEXT_PUBLIC_BASE_URL`**: The live URL of the application (e.g. `https://your-app.vercel.app` or `https://your-custom-domain.com`).
* **`ADMIN_USER_IDS`**: Comma-separated list of Clerk user IDs for administrators who should have admin dashboard access.
