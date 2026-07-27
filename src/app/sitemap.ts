import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://getsawti.com";
  const locales = ["en", "ar"];

  // List of public landing routes relative to languages
  const publicPaths = ["", "pricing", "egyptian-voice"];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const path of publicPaths) {
    for (const locale of locales) {
      const routePath = path ? `${locale}/${path}` : locale;
      sitemapEntries.push({
        url: `${baseUrl}/${routePath}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: path === "" ? 1.0 : 0.8,
      });
    }
  }

  return sitemapEntries;
}
