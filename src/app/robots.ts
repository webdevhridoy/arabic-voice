import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://getsawti.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/en", "/ar", "/sitemap.xml"],
        disallow: ["/dashboard", "/admin", "/api/", "/sign-in", "/sign-up"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
