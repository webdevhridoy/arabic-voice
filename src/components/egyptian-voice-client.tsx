"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { LandingPageTemplate } from "@/components/landing-page-template";
import { type Lang } from "@/lib/translations";

interface EgyptianVoiceClientProps {
  lang: Lang;
}

export function EgyptianVoiceClient({ lang }: EgyptianVoiceClientProps) {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Reset checkout button loading states on page show
  useEffect(() => {
    const handlePageShow = () => setLoadingPlan(null);
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const handleActionClick = () => {
    router.push("/dashboard");
  };

  const handleCheckout = async (planId: string) => {
    if (planId === "free") {
      handleActionClick();
      return;
    }
    if (!userId) {
      router.push(`/sign-up?force_redirect_url=${encodeURIComponent(`/api/checkout/redirect?plan=${planId}`)}`);
      return;
    }
    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Checkout error — please try again.");
        setLoadingPlan(null);
      }
    } catch {
      alert("Network error — please try again.");
      setLoadingPlan(null);
    }
  };

  const isAr = lang === "ar";

  // ── Hero Section Copy Overrides ───────────────────────────────────────────
  const heroOverrides = {
    badge: isAr ? "توليد تعليق صوتي مصري بالذكاء الاصطناعي" : "Egyptian Arabic Voice AI Generator",
    headline1: isAr ? "صوت مصري" : "Egyptian Arabic Voice,",
    headline2: isAr ? "طبيعي" : "Generated in",
    headline3: isAr ? "في ثوانٍ" : "Seconds",
    subtext: isAr
      ? "حوّل أي نص إلى تعليق صوتي باللهجة المصرية بالذكاء الاصطناعي. صوت مصري أصلي بجودة استوديو، جاهز لفيديوهاتك وإعلاناتك ودروسك."
      : "Turn any text into a natural Egyptian voiceover with AI. Authentic Egyptian dialect, studio quality, ready for your videos, ads, and lessons.",
  };

  // ── Features Section Copy Overrides (3 columns layout) ────────────────────
  const featuresOverrides = isAr ? [
    {
      title: "لهجة مصرية أصلية",
      desc: "ليس صوتاً عربياً عاماً، بل أصوات تنطق كما تتحدث مصر فعلاً، طبيعية لأكبر جمهور في العالم العربي.",
    },
    {
      title: "مصمم لصنّاع المحتوى",
      desc: "تعليق صوتي ليوتيوب وتيك توك والإعلانات والتعليم والمونتاج. حمّل ملف MP3 نظيفاً وأضفه مباشرة إلى مونتاجك.",
    },
    {
      title: "فوري وبتكلفة بسيطة",
      desc: "لا استوديو ولا حجز معلّق صوتي. اكتب، اسمع، حمّل. ابدأ مجاناً ورقِّ باقتك فقط عند الحاجة.",
    },
  ] : [
    {
      title: "Authentic Egyptian dialect",
      desc: "Not generic Arabic. Voices that sound the way Egypt actually speaks, natural for the biggest audience in the Arab world.",
    },
    {
      title: "Made for creators",
      desc: "Voiceovers for YouTube, TikTok, ads, e-learning, and montage. Download clean MP3 audio and drop it straight into your edit.",
    },
    {
      title: "Instant and affordable",
      desc: "No studio, no booking a voice actor. Type, listen, download. Start free and upgrade only when you need more minutes.",
    },
  ];

  // ── FAQ Accordion Section Copy Overrides ──────────────────────────────────
  const faqOverrides = isAr ? [
    {
      q: "ما هو مولّد الصوت المصري بالذكاء الاصطناعي؟",
      a: "ج1: هو أداة تحوّل النص المكتوب إلى صوت منطوق باللهجة المصرية. بدلاً من توظيف معلّق صوتي أو تسجيل صوتك بنفسك، اكتب النص وسينشئ صوتي تعليقاً صوتياً مصرياً طبيعياً يمكنك تحميله.",
    },
    {
      q: "هل يمكنني استخدام الأصوات في فيديوهات يوتيوب وتيك توك؟",
      a: "ج2: نعم. الصوت الناتج ملك لك لاستخدامه في محتواك، بما في ذلك فيديوهات يوتيوب وتيك توك وريلز إنستغرام والإعلانات والدورات التعليمية. الباقات المدفوعة تشمل الاستخدام التجاري.",
    },
    {
      q: "ما الفرق بين هذا وتحويل النص إلى كلام العادي؟",
      a: "ج3: معظم أدوات تحويل النص إلى كلام تنتج صوتاً عربياً واحداً عاماً. صوتي يقدم أصواتاً مخصصة لكل لهجة، فيسمع جمهورك المصري صوتاً محلياً طبيعياً بدلاً من صوت رسمي أو غريب.",
    },
  ] : [
    {
      q: "What is an Egyptian Arabic voice generator?",
      a: "It is an AI tool that converts written text into spoken audio in the Egyptian dialect. Instead of hiring a voice actor or recording yourself, you type your script and Sawti generates a natural Egyptian voice you can download as audio.",
    },
    {
      q: "Can I use the Egyptian voices for YouTube and TikTok videos?",
      a: "Yes. The generated audio is yours to use in your content, including YouTube videos, TikTok, Instagram reels, ads, and e-learning courses. Paid plans include commercial use.",
    },
    {
      q: "How is this different from regular Arabic text to speech?",
      a: "Most Arabic text to speech tools produce one generic Arabic voice. Sawti offers dialect-specific voices, so your Egyptian audience hears a voice that sounds local and natural rather than formal or foreign.",
    },
  ];

  return (
    <LandingPageTemplate
      lang={lang}
      loadingPlan={loadingPlan}
      onCheckout={handleCheckout}
      onActionClick={handleActionClick}
      userId={userId}
      isLoaded={isLoaded}
      heroOverrides={heroOverrides}
      featuresOverrides={featuresOverrides}
      faqOverrides={faqOverrides}
      defaultDialect="egyptian"
      defaultVoiceId="omar"
    />
  );
}
