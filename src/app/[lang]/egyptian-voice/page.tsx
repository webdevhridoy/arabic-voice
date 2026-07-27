import { notFound } from "next/navigation";
import { EgyptianVoiceClient } from "@/components/egyptian-voice-client";
import { type Lang } from "@/lib/translations";
import type { Metadata } from "next";

// Statically pre-render [lang]/egyptian-voice paths for english and arabic
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
    ? "صوت مصري بالذكاء الاصطناعي – تعليق صوتي باللهجة المصرية | صوتي" 
    : "Egyptian Arabic Voice Generator – AI Voiceover in Egyptian Dialect | Sawti";
  const description = lang === "ar"
    ? "أنشئ تعليقاً صوتياً بصوت مصري طبيعي بالذكاء الاصطناعي. اكتب النص واسمع النتيجة في ثوانٍ. مثالي للفيديوهات والإعلانات والمونتاج. جرّب مجاناً."
    : "Generate natural Egyptian Arabic voiceovers with AI. Authentic Egyptian dialect voices for videos, ads, and content. Type your text and listen in seconds. Free to try.";

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${lang}/egyptian-voice`,
      languages: {
        en: `${siteUrl}/en/egyptian-voice`,
        ar: `${siteUrl}/ar/egyptian-voice`,
        "x-default": `${siteUrl}/ar/egyptian-voice`, // default to Arabic
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${lang}/egyptian-voice`,
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

  return <EgyptianVoiceClient lang={lang as Lang} />;
}
