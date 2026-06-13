import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent browsers from guessing MIME type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block site from being embedded in iframes (clickjacking protection)
  { key: "X-Frame-Options", value: "DENY" },
  // Enable XSS protection in older browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Control how much referrer info is sent
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable unused browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Force HTTPS for 1 year
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
