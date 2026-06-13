import { NextRequest, NextResponse } from "next/server";
import { checkExtractRateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

// ── SSRF Protection: Block private/internal IP ranges ────────────────────────
function isSafeUrl(raw: string): { safe: boolean; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { safe: false, reason: "Invalid URL format" };
  }

  // Only allow http and https
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { safe: false, reason: "Only HTTP/HTTPS URLs are allowed" };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and loopback
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost")
  ) {
    return { safe: false, reason: "Internal URLs are not allowed" };
  }

  // Block private IP ranges (10.x, 172.16-31.x, 192.168.x)
  const privateRanges = [
    /^10\.\d+\.\d+\.\d+$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
    /^192\.168\.\d+\.\d+$/,
    /^169\.254\.\d+\.\d+$/, // link-local
    /^0\.0\.0\.0$/,
  ];
  if (privateRanges.some((r) => r.test(hostname))) {
    return { safe: false, reason: "Private IP addresses are not allowed" };
  }

  // Block internal cloud metadata endpoints
  const blockedHosts = ["metadata.google.internal", "169.254.169.254"];
  if (blockedHosts.includes(hostname)) {
    return { safe: false, reason: "Internal endpoints are not allowed" };
  }

  return { safe: true };
}

export async function POST(req: NextRequest) {
  try {
    // ── Rate Limiting ─────────────────────────────────────────────────────
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip")
      ?? "unknown";

    const rateCheck = await checkExtractRateLimit(ip);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before extracting again." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    // ── SSRF Protection ───────────────────────────────────────────────────
    const safeCheck = isSafeUrl(url.trim());
    if (!safeCheck.safe) {
      return NextResponse.json(
        { error: `Invalid URL: ${safeCheck.reason}` },
        { status: 400 }
      );
    }

    // Use Jina Reader API (free, no API key required) to extract article text
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { "Accept": "text/plain" },
      signal: AbortSignal.timeout(30_000), // 30s timeout
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to extract text from URL" }, { status: 400 });
    }

    let text = await res.text();

    // Clean up markdown formatting
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // links
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");   // images
    text = text.replace(/[#*`_>]/g, "");                   // markdown symbols

    // Limit extracted text to 10,000 chars to prevent abuse
    text = text.trim().slice(0, 10_000);

    return NextResponse.json({ text });
  } catch (error: any) {
    if (error?.name === "TimeoutError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 408 });
    }
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
