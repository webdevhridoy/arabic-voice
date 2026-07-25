import { notFound } from "next/navigation";
import { PricingPageClient } from "@/components/pricing-page-client";
import { type Lang } from "@/lib/translations";
import type { Metadata } from "next";

// Statically pre-render [lang]/pricing paths for english and arabic
export function generateStaticParams() {
  return [{ lang: "en" }, { lang: "ar" }];
}

interface PageProps {
  params: Promise<{ lang: string }>;
}

// Generate dynamic technical SEO metadata on the server side
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;

  if (lang !== "en" && lang !== "ar") {
    return {};
  }

  const siteUrl = "https://getsawti.com";
  const title = lang === "ar" 
    ? "الأسعار – صوتي لتحويل النص إلى كلام" 
    : "Pricing – Sawti Arabic Text to Speech";
  const description = lang === "ar"
    ? "باقات بسيطة لصنّاع المحتوى والشركات. أنشئ صوتاً عربياً بجودة استوديو باشتراك شهري مرن. ابدأ مجاناً."
    : "Simple plans for creators and businesses. Generate studio-quality Arabic audio with flexible monthly subscriptions. Start free.";

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${lang}/pricing`,
      languages: {
        en: `${siteUrl}/en/pricing`,
        ar: `${siteUrl}/ar/pricing`,
        "x-default": `${siteUrl}/ar/pricing`, // default to Arabic
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${lang}/pricing`,
      siteName: "Sawti | صوتي",
      locale: lang === "ar" ? "ar_AR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { lang } = await params;

  if (lang !== "en" && lang !== "ar") {
    notFound();
  }

  return <PricingPageClient lang={lang as Lang} />;
}
