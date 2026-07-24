import { notFound } from "next/navigation";
import { HomePageClient } from "@/components/home-page-client";
import { type Lang } from "@/lib/translations";
import type { Metadata } from "next";

// Statically pre-render [lang] paths for english and arabic
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
    ? "صوتي | Premium Arabic Text to Speech" 
    : "Sawti | Premium Arabic Text to Speech";
  const description = lang === "ar"
    ? "حول النص العربي إلى صوت طبيعي في ثوانٍ مع صوتي. أفضل منصة ذكاء اصطناعي لتحويل النص إلى كلام باللغة العربية."
    : "Turn Arabic text into natural audio in seconds with Sawti. The best TTS SaaS for Arabic voices.";

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${lang}`,
      languages: {
        en: `${siteUrl}/en`,
        ar: `${siteUrl}/ar`,
        "x-default": `${siteUrl}/ar`, // default to Arabic
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${lang}`,
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

  return <HomePageClient lang={lang as Lang} />;
}
