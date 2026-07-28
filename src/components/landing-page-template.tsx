"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { ModeToggle } from "@/components/mode-toggle";
import { LangToggle } from "@/components/lang-toggle";
import { VoiceGenerator } from "@/components/voice-generator";
import { translations, type Lang } from "@/lib/translations";
import {
  Mic, Download, Zap, Sparkles, Check, PlayCircle, Globe,
  Headphones, Users, Volume2, Play, Loader2, Plus, Minus
} from "lucide-react";

// Reusable FAQ Item Component
function FAQItem({ q, a, isAr }: { q: string; a: string; isAr: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-border/60 bg-card rounded-2xl p-5 card-shadow transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left font-bold text-foreground text-sm md:text-base gap-4"
        dir={isAr ? "rtl" : "ltr"}
      >
        <span className={isAr ? "text-right" : "text-left"}>{q}</span>
        {isOpen ? (
          <Minus className="w-4 h-4 text-primary shrink-0" />
        ) : (
          <Plus className="w-4 h-4 text-primary shrink-0" />
        )}
      </button>
      
      {/* Container is always rendered in the HTML for SEO indexing, but collapsed visually */}
      <div 
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <p 
            className={`text-muted-foreground text-xs md:text-sm leading-relaxed ${
              isAr ? "text-right" : "text-left"
            }`} 
            dir={isAr ? "rtl" : "ltr"}
          >
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

// Icon mapping for features
const featureIcons = [
  <Zap      key="zap"   className="w-6 h-6 group-hover:rotate-12 transition-transform duration-500" />,
  <Mic      key="mic"   className="w-6 h-6 group-hover:scale-110 transition-transform duration-500" />,
  <Download key="dl"    className="w-6 h-6 group-hover:-translate-y-1 transition-transform duration-500" />,
  <Users    key="users" className="w-6 h-6 group-hover:scale-110 transition-transform duration-500" />,
];

const featureColors = [
  { bg: "bg-primary/10",   text: "text-primary",   hoverCard: "hover:border-primary/50 hover:shadow-[0_10px_40px_-15px_rgba(124,92,255,0.3)]",   hoverIcon: "group-hover:bg-primary group-hover:text-primary-foreground",   hoverH3: "group-hover:text-primary" },
  { bg: "bg-secondary/10", text: "text-secondary", hoverCard: "hover:border-secondary/50 hover:shadow-[0_10px_40px_-15px_rgba(32,199,183,0.3)]", hoverIcon: "group-hover:bg-secondary group-hover:text-secondary-foreground", hoverH3: "group-hover:text-secondary" },
  { bg: "bg-accent/10",    text: "text-accent",    hoverCard: "hover:border-accent/50 hover:shadow-[0_10px_40px_-15px_rgba(214,178,94,0.3)]",    hoverIcon: "group-hover:bg-accent group-hover:text-accent-foreground",    hoverH3: "group-hover:text-accent" },
  { bg: "bg-primary/10",   text: "text-primary",   hoverCard: "hover:border-primary/50 hover:shadow-[0_10px_40px_-15px_rgba(124,92,255,0.3)]",   hoverIcon: "group-hover:bg-primary group-hover:text-primary-foreground",   hoverH3: "group-hover:text-primary" },
];

const trustIcons = [
  <Globe    key="g" className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300 flex-shrink-0" />,
  <Sparkles key="s" className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300 flex-shrink-0" />,
  <Download key="d" className="w-5 h-5 group-hover:-translate-y-1 transition-transform duration-300 flex-shrink-0" />,
  <Users    key="u" className="w-5 h-5 group-hover:scale-110 transition-transform duration-300 flex-shrink-0" />,
];

const trustHover = ["hover:text-primary", "hover:text-secondary", "hover:text-accent", "hover:text-primary"];
const stepStyles = [
  { num: "bg-card border-2 border-border text-primary", hTitle: "text-foreground" },
  { num: "bg-primary text-white shadow-[0_4px_20px_-4px_rgba(124,92,255,0.5)]",  hTitle: "text-primary" },
  { num: "bg-card border-2 border-border text-secondary", hTitle: "text-foreground" },
];

const chipColors = [
  "hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-[0_10px_20px_-10px_rgba(124,92,255,0.5)]",
  "hover:bg-secondary hover:text-secondary-foreground hover:border-secondary hover:shadow-[0_10px_20px_-10px_rgba(32,199,183,0.5)]",
  "hover:bg-accent hover:text-accent-foreground hover:border-accent hover:shadow-[0_10px_20px_-10px_rgba(214,178,94,0.5)]",
  "hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-[0_10px_20px_-10px_rgba(124,92,255,0.5)]",
];

const VOICES = ["ali", "omar", "khalid", "ziad", "hassan", "tariq", "maya", "layla", "nour", "sara"] as const;
type VoiceId = typeof VOICES[number];

const VOICE_GENDER: Record<VoiceId, "male" | "female"> = {
  ali: "male", omar: "male", khalid: "male", ziad: "male", hassan: "male", tariq: "male",
  maya: "female", layla: "female", nour: "female", sara: "female"
};

const VOICE_POPULAR: Record<VoiceId, boolean> = {
  ali: true, omar: false, khalid: false, ziad: false, hassan: false, tariq: false,
  maya: true, layla: false, nour: false, sara: false
};

interface LandingPageTemplateProps {
  lang: Lang;
  onLangToggle?: () => void;
  loadingPlan: string | null;
  onCheckout: (planId: string) => void;
  onActionClick: () => void;
  userId: string | null | undefined;
  isLoaded: boolean;
  // Custom Content Overrides for flexibility
  heroOverrides?: {
    badge?: string;
    headline1?: string;
    headline2?: string;
    headline3?: string;
    subtext?: string;
    ctaPrimary?: string;
    ctaSecondary?: string;
  };
  faqOverrides?: { q: string; a: string }[];
  onlyPricing?: boolean;
  defaultDialect?: any;
  defaultVoiceId?: any;
  featuresOverrides?: { title: string; desc: string }[];
}

export function LandingPageTemplate({
  lang,
  onLangToggle,
  loadingPlan,
  onCheckout,
  onActionClick,
  userId,
  isLoaded,
  heroOverrides,
  faqOverrides,
  onlyPricing = false,
  defaultDialect = "msa",
  defaultVoiceId = "ali",
  featuresOverrides,
}: LandingPageTemplateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = translations[lang];
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const ta = isAr ? "text-right" : "text-left";

  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
  const waveUrl = "https://assets.streamlinehq.com/image/private/w_400,h_400,ar_1/f_auto/v1/icons/music/audio-waves-7-h27tstn3r42fdf4t28b3m.png?_a=DAJFJtWIZAAC";

  const toggleVoiceCard = (id: string) => {
    setIsPlaying((p) => ({ ...p, [id]: !p[id] }));
    setTimeout(() => setIsPlaying((p) => ({ ...p, [id]: false })), 3000);
  };

  // Default toggle handler routes from /en to /ar or vice-versa
  const handleLangToggle = onLangToggle || (() => {
    const nextLang = lang === "en" ? "ar" : "en";
    const segments = pathname.split("/");
    if (segments[1] === "en" || segments[1] === "ar") {
      segments[1] = nextLang;
    } else {
      segments.splice(1, 0, nextLang);
    }
    router.push(segments.join("/"));
  });

  const resolvedHero = {
    badge: heroOverrides?.badge || t.hero.badge,
    headline1: heroOverrides?.headline1 || t.hero.headline1,
    headline2: heroOverrides?.headline2 || t.hero.headline2,
    headline3: heroOverrides?.headline3 || t.hero.headline3,
    subtext: heroOverrides?.subtext || t.hero.subtext,
    ctaPrimary: heroOverrides?.ctaPrimary || t.hero.ctaPrimary,
    ctaSecondary: heroOverrides?.ctaSecondary || t.hero.ctaSecondary,
  };

  const resolvedFaq = faqOverrides || t.faq?.items || [];
  const resolvedFeatures = featuresOverrides || t.features.items;
  const gridCols = resolvedFeatures.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4";

  return (
    <div dir={dir} className="relative text-foreground min-h-screen font-sans selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      {/* ── Background ─────── */}
      <div className="fixed inset-0 -z-30 bg-background transition-colors duration-300" />
      <div className="fixed top-0 left-0 w-[700px] h-[700px] hero-left-glow -z-20 pointer-events-none" />
      <div className="fixed top-[-5%] right-[-8%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-20 pointer-events-none animate-pulse" style={{ animationDuration: "9s" }} />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-background/60 pointer-events-none" />

      {/* ── Nav ───────────── */}
      <nav className="fixed top-0 w-full z-50 bg-background/75 backdrop-blur-2xl border-b border-border/60 transition-colors duration-300">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-[68px]">
          <div className="flex items-center gap-10">
            <Link href={`/${lang}`} className="group flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-[0_0_12px_rgba(124,92,255,0.4)]">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground tracking-tight">صوتي</span>
            </Link>
            <div className="hidden md:flex gap-7 items-center">
              <Link className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors duration-200" href="#demo">{t.nav.voices}</Link>
              <Link className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors duration-200" href="#features">{t.nav.features}</Link>
              <Link className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors duration-200" href="#pricing">{t.nav.pricing}</Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <LangToggle lang={lang} onToggle={handleLangToggle} />
            
            {isLoaded && !userId && (
              <>
                <SignInButton mode="modal" forceRedirectUrl="/" signUpForceRedirectUrl="/">
                  <button className="text-muted-foreground hover:text-foreground text-sm font-medium px-4 py-2 hidden sm:block transition-colors duration-200">
                    {t.nav.signIn}
                  </button>
                </SignInButton>
                <SignInButton mode="modal" forceRedirectUrl="/" signUpForceRedirectUrl="/">
                  <button className="px-5 py-2 h-9 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary/90 hover:shadow-[0_0_18px_rgba(124,92,255,0.45)] active:scale-95 transition-all duration-200">
                    {t.nav.startNow}
                  </button>
                </SignInButton>
              </>
            )}

            {isLoaded && userId && (
              <>
                <Link href="/dashboard" className="hidden sm:block">
                  <button className="px-5 py-2 h-9 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary/90 hover:shadow-[0_0_18px_rgba(124,92,255,0.45)] active:scale-95 transition-all duration-200 mr-1">
                    {lang === "ar" ? "لوحة التحكم" : "Dashboard"}
                  </button>
                </Link>
                <UserButton />
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {!onlyPricing && (
          <>
            {/* ── 1. Hero ──────────────────────────────────────────── */}
        <section className="relative max-w-7xl mx-auto px-6 pt-4 pb-8 md:pb-10">
          <div className="flex flex-col items-center text-center max-w-6xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-semibold mb-4 cursor-default">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              <span>{resolvedHero.badge}</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.12] mb-4 tracking-tight max-w-5xl" style={{ fontFamily: "var(--font-headline)" }}>
              <span className="text-foreground">{resolvedHero.headline1} </span>
              {lang === "ar" && <br />}
              <span className="text-gradient">{resolvedHero.headline2} </span>
              <span className="text-foreground">{resolvedHero.headline3}</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6 max-w-3xl">
              {resolvedHero.subtext}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => document.getElementById("live-demo")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full sm:w-auto px-8 py-3.5 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary/90 hover:shadow-[0_8px_30px_-6px_rgba(124,92,255,0.55)] hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                {resolvedHero.ctaPrimary}
                <PlayCircle className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              </button>
              <button
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full sm:w-auto px-8 py-3.5 bg-card text-foreground border border-border rounded-full text-sm font-bold hover:bg-muted hover:border-border hover:-translate-y-0.5 transition-all duration-200 card-shadow"
              >
                {resolvedHero.ctaSecondary}
              </button>
            </div>
          </div>
        </section>

        {/* ── 2. LIVE TTS SECTION (fully functional) ─────────────── */}
        <section id="live-demo" className="max-w-6xl mx-auto px-6 mb-12 md:mb-16">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/15 text-primary text-xs font-semibold mb-4 cursor-default">
              <Volume2 className="w-3.5 h-3.5" />
              <span>{lang === "ar" ? "جرّب الآن مجاناً" : "Try It Free — Right Now"}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2.5" style={{ fontFamily: "var(--font-headline)" }}>
              {lang === "ar" ? "حوّل نصك إلى صوت في ثوانٍ" : "Convert Your Text to Voice in Seconds"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {lang === "ar" ? "اختر صوتاً، الصق النص، واستمع فوراً" : "Pick a voice, paste your text, and listen instantly."}
            </p>
          </div>
          <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <VoiceGenerator lang={lang} defaultDialect={defaultDialect} defaultVoiceId={defaultVoiceId} />
          </Suspense>
        </section>

        {/* ── 3. Features ────────────────────────────────────────── */}
        <section id="features" className="max-w-7xl mx-auto px-6 mb-24 scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{t.features.title}</h2>
            <p className="text-muted-foreground text-sm">{t.features.subtitle}</p>
          </div>
          <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
            {resolvedFeatures.map((f, i) => (
              <div 
                key={i} 
                className={`group bg-card border border-border/75 rounded-2xl p-6 ${featureColors[i].hoverCard} hover:-translate-y-1 transition-all duration-500 cursor-default flex flex-col`}
              >
                <div className={`w-12 h-12 rounded-xl ${featureColors[i].bg} ${featureColors[i].text} flex items-center justify-center mb-5 ${featureColors[i].hoverIcon} transition-colors duration-300 shadow-sm`}>
                  {featureIcons[i]}
                </div>
                <h3 className={`text-base font-bold text-foreground mb-2 ${ta} ${featureColors[i].hoverH3} transition-colors duration-200`}>{f.title}</h3>
                <p className={`text-muted-foreground text-sm leading-relaxed ${ta}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. How It Works ────────────────────────────────────── */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 mb-24">
          <div className="bg-card border border-border/70 rounded-2xl p-8 md:p-12 card-shadow">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{t.howItWorks.title}</h2>
              <p className="text-muted-foreground text-sm">{t.howItWorks.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
              <div className="hidden md:block absolute top-[2.75rem] left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-border" />
              {t.howItWorks.steps.map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className={`w-11 h-11 ${stepStyles[i].num} rounded-full flex items-center justify-center mb-5 text-sm font-bold shrink-0 z-10`}>0{i + 1}</div>
                  <h3 className={`text-base font-bold text-foreground mb-2 ${stepStyles[i].hTitle}`}>{step.label}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. Voices Showcase ─────────────────────────────────── */}
        <section id="demo" className="max-w-7xl mx-auto px-6 mb-24">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/15 text-primary text-xs font-semibold mb-4 cursor-default">
              <Headphones className="w-3.5 h-3.5" />
              <span>{t.voices.badge}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2.5">{t.voices.title}</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">{t.voices.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {VOICES.map((v) => {
              const info = t.voices[v];
              const isFem = VOICE_GENDER[v] === "female";
              const isPop = VOICE_POPULAR[v];
              const playing = !!isPlaying[v];

              const accent = isFem ? "secondary" : isPop ? "primary" : "accent";
              const hoverBorder = accent === "primary"
                ? "hover:border-primary/50 hover:shadow-[0_8px_30px_-10px_rgba(124,92,255,0.35)]"
                : accent === "secondary"
                ? "hover:border-secondary/50 hover:shadow-[0_8px_30px_-10px_rgba(32,199,183,0.35)]"
                : "hover:border-accent/50 hover:shadow-[0_8px_30px_-10px_rgba(214,178,94,0.25)]";

              const hoverText = `group-hover:text-${accent}`;
              const accentText = `text-${accent}`;
              const btnActive = accent === "primary"
                ? "bg-primary text-primary-foreground border-primary"
                : accent === "secondary"
                ? "bg-secondary text-secondary-foreground border-secondary"
                : "bg-accent text-accent-foreground border-accent";
              const btnHover = accent === "primary"
                ? "hover:bg-primary hover:text-primary-foreground hover:border-primary"
                : accent === "secondary"
                ? "hover:bg-secondary hover:text-secondary-foreground hover:border-secondary"
                : "hover:bg-accent hover:text-accent-foreground hover:border-accent";

              return (
                <div
                  key={v}
                  className={`relative group bg-card border ${isPop ? "border-primary/30" : "border-border"} rounded-2xl p-5 ${hoverBorder} hover:-translate-y-2 transition-all duration-500 cursor-default flex flex-col overflow-hidden`}
                >
                  {isPop && (
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-[80px] -z-10 group-hover:scale-150 group-hover:bg-primary/10 transition-transform duration-700" />
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <button
                      onClick={() => toggleVoiceCard(v)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 text-foreground bg-background border-border ${
                        playing ? `${btnActive} animate-pulse` : `${btnHover}`
                      }`}
                    >
                      {playing ? (
                        <img src={waveUrl} className="w-5 h-5 object-contain opacity-60 invert dark:invert-0" alt="" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    <div className="flex flex-col items-end gap-1">
                      {isPop && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 ${accentText}`}>
                          {t.voices.mostUsed}
                        </span>
                      )}
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {isFem ? t.voices.female : t.voices.male}
                      </span>
                    </div>
                  </div>

                  <h3 className={`text-base font-bold text-foreground mb-0.5 ${ta} ${hoverText} transition-colors duration-300`}>
                    {info.name}
                  </h3>
                  <p className={`${accentText} text-xs font-semibold mb-3 ${ta}`}>{info.style}</p>
                  <p className={`text-muted-foreground text-xs leading-relaxed group-hover:text-foreground transition-colors duration-300 ${ta} flex-1`}>
                    {info.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 6. Use Cases ───────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 mb-24">
          <div className="bg-muted/30 rounded-2xl p-8 py-12 border border-border/60 text-center card-shadow">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">{t.useCases.title}</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {t.useCases.chips.map((chip, i) => (
                <div key={i} className={`px-5 py-2.5 bg-card border border-border rounded-xl text-sm font-medium text-foreground card-shadow ${chipColors[i]} hover:-translate-y-0.5 transition-all duration-200 cursor-default`}>{chip}</div>
              ))}
            </div>
          </div>
        </section>
      </>
    )}

        {/* ── 7. Pricing ─────────────────────────────────────────── */}
        <section id="pricing" className="max-w-5xl mx-auto px-6 mb-24">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2.5">{t.pricing.title}</h2>
            <p className="text-muted-foreground text-sm">{t.pricing.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.pricing.plans.map((plan: any, i: number) => {
              const isPop = plan.popular;
              return (
                <div key={i} className={`group bg-card ${isPop ? "border-2 border-primary" : "border border-border/70"} rounded-2xl p-6 flex flex-col relative card-shadow ${isPop ? "hover:shadow-[0_16px_48px_-10px_rgba(124,92,255,0.35)]" : "hover:border-border hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)]"} hover:-translate-y-1 transition-all duration-300`}>
                  {plan.badge && (
                    <div className={`absolute top-0 ${isAr ? "right-5" : "left-5"} -translate-y-1/2 ${isPop ? "bg-primary" : "bg-secondary"} text-white px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide`}>{plan.badge}</div>
                  )}
                  <h3 className={`text-base font-bold text-foreground mb-1.5 ${ta}`}>{plan.name}</h3>
                  <div className={`flex items-baseline gap-1 mb-6 ${isAr ? "flex-row-reverse justify-end" : ""}`}>
                    <span className={`text-2xl font-extrabold ${isPop ? "text-primary" : "text-foreground"}`}>{plan.price}</span>
                    <span className="text-muted-foreground text-xs">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-7 flex-1">
                    {plan.features.map((f: string, j: number) => (
                      <li key={j} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                        <Check className={`w-3.5 h-3.5 mt-0.5 ${isPop ? "text-primary" : "text-secondary"} flex-shrink-0`} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => onCheckout(plan.id)}
                    disabled={loadingPlan === plan.id}
                    className={`w-full py-2.5 text-sm ${isPop ? "bg-primary text-white hover:bg-primary/90" : "bg-muted text-foreground border border-border hover:bg-muted/80"} rounded-xl font-semibold active:scale-95 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {loadingPlan === plan.id ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />{lang === "ar" ? "جاري التحميل..." : "Loading..."}</>
                    ) : plan.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

      {!onlyPricing && (
        <>
          {/* ── 8. FAQ Section ──────────────────────────────────────── */}
        {resolvedFaq.length > 0 && (
          <section id="faq" className="max-w-4xl mx-auto px-6 mb-24">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2.5">
                {t.faq?.title || (isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions")}
              </h2>
              <p className="text-muted-foreground text-sm">
                {t.faq?.subtitle || (isAr ? "لديك أسئلة؟ لدينا الإجابات." : "Got questions? We've got answers.")}
              </p>
            </div>
            <div className="space-y-4">
              {resolvedFaq.map((item: any, i: number) => (
                <FAQItem key={i} q={item.q} a={item.a} isAr={isAr} />
              ))}
            </div>
          </section>
        )}

        {/* ── 9. Final CTA ───────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 mb-16">
          <div className="cta-gradient rounded-2xl p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.4)_0%,_transparent_70%)]" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white tracking-tight" style={{ fontFamily: "var(--font-headline)" }}>{t.cta.title}</h2>
              <p className="text-base mb-8 text-white/75 max-w-xl mx-auto">{t.cta.subtitle}</p>
              <button onClick={() => onActionClick()} className="px-8 py-3 bg-white text-primary rounded-full text-sm font-bold hover:bg-white/90 hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all duration-200">
                {userId ? (lang === "ar" ? "الذهاب إلى لوحة التحكم" : "Go to Dashboard") : t.cta.primary}
              </button>
            </div>
          </div>
        </section>
      </>
    )}
  </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="w-full py-8 border-t border-border/60 bg-background">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-sm text-foreground">صوتي</span>
            <span className="text-muted-foreground text-xs mx-2">·</span>
            <span className="text-muted-foreground text-xs">{t.footer.copyright}</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
            <Link href={`/${lang}/pricing`} className="hover:text-primary transition-colors duration-200">
              {t.footer.pricing}
            </Link>
            <Link href={`/${lang}/egyptian-voice`} className="hover:text-primary transition-colors duration-200">
              {lang === "ar" ? "لهجة مصرية" : "Egyptian Voice"}
            </Link>
            <a href="#"        className="hover:text-primary transition-colors duration-200">{t.footer.privacy}</a>
            <a href="#"        className="hover:text-primary transition-colors duration-200">{t.footer.terms}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
