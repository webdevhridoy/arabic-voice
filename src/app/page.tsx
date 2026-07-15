"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { getUserUsageStats } from "@/actions/generations";
import { UpgradeModal } from "@/components/upgrade-modal";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { LangToggle } from "@/components/lang-toggle";
import { translations, type Lang } from "@/lib/translations";
import { VoiceGenerator } from "@/components/voice-generator";
import {
  Mic, Download, Zap, Sparkles,
  Check, PlayCircle, Globe,
  Headphones, Users, Volume2,
  Play, Square, Loader2, ChevronDown, AlertCircle
} from "lucide-react";

// ─── Static UI maps ─────────────────────────────────────────────────────────
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
const trustHover  = ["hover:text-primary", "hover:text-secondary", "hover:text-accent", "hover:text-primary"];
const stepStyles  = [
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
const WAVE_COUNT = 28;
const STATIC_HEIGHTS = [30,45,60,80,50,40,70,90,85,45,30,20,50,75,40,25,45,80,60,35,55,95,40,20,55,70,35,50];
const VOICES = ["ali", "omar", "khalid", "ziad", "hassan", "tariq", "maya", "layla", "nour", "sara"] as const;
type VoiceId = typeof VOICES[number];

// Gender map — used for badge colours and label
const VOICE_GENDER: Record<VoiceId, "male" | "female"> = {
  ali: "male", omar: "male", khalid: "male", ziad: "male", hassan: "male", tariq: "male",
  maya: "female", layla: "female", nour: "female", sara: "female",
};
const VOICE_POPULAR: Partial<Record<VoiceId, true>> = { maya: true, ali: true };

// ─── Animated Waveform Bar component ────────────────────────────────────────
function WaveBar({ height, active, delay }: { height: number; active: boolean; delay: number }) {
  return (
    <div
      className={`rounded-full transition-all duration-150 ${
        active
          ? "bg-secondary animate-pulse"
          : "bg-primary/40"
      }`}
      style={{
        width: "3.5px",
        height: active ? `${Math.max(20, height + Math.random() * 30)}%` : `${height}%`,
        animationDelay: `${delay}ms`,
        animationDuration: active ? `${300 + delay * 2}ms` : "3s",
      }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router  = useRouter();

  // ── Language ──────────────────────────────────────────────────
  const [lang, setLang] = useState<Lang>("en");
  const t    = translations[lang];
  const isAr = lang === "ar";
  const dir  = isAr ? "rtl" : "ltr";
  const ta   = isAr ? "text-right" : "text-left";

  const { data: usage, mutate: mutateUsage } = useSWR("usage", () => getUserUsageStats(), {
    revalidateOnFocus: false
  });
  const { isLoaded, userId } = useAuth();
  const CHAR_LIMIT = (usage?.limit ?? 1000) > 1000 ? 5000 : 1000;
  const [showUpgrade, setShowUpgrade] = useState(false);

  // ── Demo card state ───────────────────────────────────────────
  const [text, setText]           = useState<string>(translations.en.demoText);
  const [selectedVoice, setVoice] = useState<VoiceId>("ali");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [status, setStatus]       = useState<"idle" | "loading" | "playing" | "error">("idle");
  const [audioUrl, setAudioUrl]   = useState<string | null>(null);
  const [errorMsg, setErrorMsg]   = useState<string>("");
  const [waveTick, setWaveTick]   = useState(0);   // forces waveform re-render while playing
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Voice card play-state (section 5) ───────────────────────
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});

  const waveUrl = "https://assets.streamlinehq.com/image/private/w_400,h_400,ar_1/f_auto/v1/icons/music/audio-waves-7-h27tstn3r42fdf4t28b3m.png?_a=DAJFJtWIZAAC";

  // ── Helpers ────────────────────────────────────────────────────
  const handleLangToggle = () => {
    const next: Lang = lang === "en" ? "ar" : "en";
    setLang(next);
    setText(translations[next].demoText);
  };

  const handleActionClick = () => {
    if (typeof window !== "undefined") localStorage.setItem("pending_tts_text", text);
    router.push("/dashboard");
  };

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

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

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (waveTimer.current) clearInterval(waveTimer.current);
    setStatus("idle");
  }, []);

  const startWaveAnimation = () => {
    if (waveTimer.current) clearInterval(waveTimer.current);
    waveTimer.current = setInterval(() => setWaveTick(n => n + 1), 120);
  };

  // Generate TTS then immediately play
  const handleGenerate = async () => {
    if (usage && !usage.allowed) {
      setShowUpgrade(true);
      return;
    }
    if (!text.trim()) return;
    stopAudio();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res  = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId: selectedVoice }),
      });
      const data = await res.json();

      if (!res.ok || !data.audioUrl) {
        setErrorMsg(data.error ?? "Generation failed — please try again.");
        setStatus("error");
        return;
      }

      setAudioUrl(data.audioUrl);
      const audio = new Audio(data.audioUrl);
      audioRef.current = audio;
      audio.onended  = () => { setStatus("idle"); if (waveTimer.current) clearInterval(waveTimer.current); };
      audio.onerror  = () => { setStatus("error"); setErrorMsg("Playback failed."); };
      await audio.play();
      setStatus("playing");
      startWaveAnimation();
    } catch {
      setErrorMsg("Could not connect to audio service.");
      setStatus("error");
    }
  };

  // Download last generated file
  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href     = audioUrl;
    a.download = `sawti-${selectedVoice}-${Date.now()}.mp3`;
    a.click();
  };

  // Replay already-generated audio
  const handleReplay = async () => {
    if (!audioUrl) return;
    stopAudio();
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => { setStatus("idle"); if (waveTimer.current) clearInterval(waveTimer.current); };
    await audio.play();
    setStatus("playing");
    startWaveAnimation();
  };

  // Section-5 voice card preview
  const toggleVoiceCard = (id: string) => {
    setIsPlaying(p => ({ ...p, [id]: !p[id] }));
    setTimeout(() => setIsPlaying(p => ({ ...p, [id]: false })), 3000);
  };

  // Cleanup on unmount
  useEffect(() => () => {
    if (audioRef.current) audioRef.current.pause();
    if (waveTimer.current)  clearInterval(waveTimer.current);
  }, []);

  // Reset pricing button loading state when browser restores page from BFCache
  // (e.g. user clicks Subscribe Now → goes to Lemon Squeezy → hits Back button)
  useEffect(() => {
    const handlePageShow = () => setLoadingPlan(null);
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // Voice display labels (bilingual-aware)
  const voiceLabel: Record<VoiceId, string> = {
    ali:    lang === "ar" ? "علي"   : "Ali",
    omar:   lang === "ar" ? "عمر"   : "Omar",
    khalid: lang === "ar" ? "خالد"  : "Khalid",
    ziad:   lang === "ar" ? "زياد"  : "Ziad",
    hassan: lang === "ar" ? "حسن"   : "Hassan",
    tariq:  lang === "ar" ? "طارق"  : "Tariq",
    maya:   lang === "ar" ? "مايا"  : "Maya",
    layla:  lang === "ar" ? "ليلى"  : "Layla",
    nour:   lang === "ar" ? "نور"   : "Nour",
    sara:   lang === "ar" ? "سارة"  : "Sara",
  };

  // ── Generate-button label ──────────────────────────────────────
  const btnLabel = {
    idle:    lang === "ar" ? "توليد الصوت" : "Generate Voice",
    loading: lang === "ar" ? "جاري التوليد…" : "Generating…",
    playing: lang === "ar" ? "إيقاف"       : "Stop",
    error:   lang === "ar" ? "حاول مجدداً" : "Try Again",
  }[status];

  return (
    <div dir={dir} className="relative text-foreground min-h-screen font-sans selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        usedChars={(usage?.currentUsage) ?? 0}
        limitChars={(usage?.limit) ?? 0}
        lang={lang}
      />

      {/* ── Background ─────── */}
      <div className="fixed inset-0 -z-30 bg-background transition-colors duration-300" />
      {/* Soft top-left teal glow (matches design attachment) */}
      <div className="fixed top-0 left-0 w-[700px] h-[700px] hero-left-glow -z-20 pointer-events-none" />
      {/* Subtle top-right purple */}
      <div className="fixed top-[-5%] right-[-8%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-20 pointer-events-none animate-pulse" style={{ animationDuration: "9s" }} />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-background/60 pointer-events-none" />

      {/* ── Nav ───────────── */}
      <nav className="fixed top-0 w-full z-50 bg-background/75 backdrop-blur-2xl border-b border-border/60 transition-colors duration-300">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-[68px]">
          <div className="flex items-center gap-10">
            <Link href="/" className="group flex items-center gap-2">
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
                <SignInButton mode="modal">
                  <button className="text-muted-foreground hover:text-foreground text-sm font-medium px-4 py-2 hidden sm:block transition-colors duration-200">
                    {t.nav.signIn}
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <Button className="px-5 py-2 h-9 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary/90 hover:shadow-[0_0_18px_rgba(124,92,255,0.45)] active:scale-95 transition-all duration-200">
                    {t.nav.startNow}
                  </Button>
                </SignInButton>
              </>
            )}

            {isLoaded && userId && (
              <>
                <Link href="/dashboard" className="hidden sm:block">
                  <Button className="px-5 py-2 h-9 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary/90 hover:shadow-[0_0_18px_rgba(124,92,255,0.45)] active:scale-95 transition-all duration-200 mr-1">
                    {lang === "ar" ? "لوحة التحكم" : "Dashboard"}
                  </Button>
                </Link>
                <UserButton />
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-28">

        {/* ── 1. Hero ──────────────────────────────────────────── */}
        <section className="relative max-w-7xl mx-auto px-6 pt-8 pb-16 md:pb-24">

          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-semibold mb-6 cursor-default">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              <span>{t.hero.badge}</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.15] mb-6 tracking-tight max-w-4xl" style={{ fontFamily: "var(--font-headline)" }}>
              <span className="text-foreground">{t.hero.headline1} </span>
              <span className="text-gradient">{t.hero.headline2} </span>
              <span className="text-foreground">{t.hero.headline3}</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-9 max-w-2xl">
              {t.hero.subtext}
            </p>

            <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center`}>
              <button
                onClick={() => document.getElementById("live-demo")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary/90 hover:shadow-[0_8px_30px_-6px_rgba(124,92,255,0.55)] hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                {t.hero.ctaPrimary}
                <PlayCircle className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              </button>
              <button
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full sm:w-auto px-8 py-4 bg-card text-foreground border border-border rounded-full text-sm font-bold hover:bg-muted hover:border-border hover:-translate-y-0.5 transition-all duration-200 card-shadow"
              >
                {t.hero.ctaSecondary}
              </button>
            </div>
          </div>
        </section>

        {/* ── LIVE TTS SECTION (fully functional) ─────────────── */}
        <section id="live-demo" className="max-w-6xl mx-auto px-6 mb-16 md:mb-24">
          {/* Heading */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/15 text-primary text-xs font-semibold mb-4 cursor-default">
              <Volume2 className="w-3.5 h-3.5" />
              <span>{lang === "ar" ? "جرّب الآن مجاناً" : "Try It Free — Right Now"}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2.5" style={{ fontFamily: "var(--font-headline)" }}>
              {lang === "ar" ? "حوّل نصك إلى صوت في ثوانٍ" : "Convert Your Text to Voice in Seconds"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {lang === "ar" ? "اختر صوتاً، الصق نصك، واستمع فوراً." : "Pick a voice, paste your text, and listen instantly."}
            </p>
          </div>

          <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <VoiceGenerator lang={lang} />
          </Suspense>
        </section>

        {/* ── 2. Trust Strip ─────────────────────────────────────── */}
        <section className="border-y border-border/60 bg-muted/30 py-7 mb-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap justify-between items-center gap-6">
              {t.trust.map((item, i) => (
                <div key={i} className={`group flex items-center gap-2.5 text-muted-foreground text-sm font-medium w-full md:w-auto justify-center md:justify-start ${trustHover[i]} transition-colors duration-200 cursor-default`}>
                  {trustIcons[i]}
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. Features ────────────────────────────────────────── */}
        <section id="features" className="max-w-7xl mx-auto px-6 mb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{t.features.title}</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">{t.features.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {t.features.items.map((f, i) => (
              <div key={i} className={`group p-7 bg-card border border-border/70 rounded-2xl card-shadow ${featureColors[i].hoverCard} hover:-translate-y-1 transition-all duration-300 cursor-default`}>
                <div className={`w-10 h-10 ${featureColors[i].bg} ${featureColors[i].text} rounded-xl flex items-center justify-center mb-5 ${featureColors[i].hoverIcon} transition-all duration-300`}>
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
              {/* connector line */}
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

        {/* ── 5. Voices ──────────────────────────────────────────── */}
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
              const info   = t.voices[v];
              const isFem  = VOICE_GENDER[v] === "female";
              const isPop  = VOICE_POPULAR[v];
              const playing = !!isPlaying[v];

              // Per-voice accent colour palette
              const accent = isFem
                ? "secondary"          // female  → teal
                : isPop
                ? "primary"            // ali     → purple
                : "accent";            // other males → gold

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
                  {/* Glow blob for popular */}
                  {isPop && (
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-[80px] -z-10 group-hover:scale-150 group-hover:bg-primary/10 transition-transform duration-700" />
                  )}

                  {/* Top row: play btn + badges */}
                  <div className="flex items-start justify-between mb-4">
                    <button
                      onClick={() => toggleVoiceCard(v)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 text-foreground bg-background border-border ${playing ? `${btnActive} animate-pulse` : `${btnHover}`}`}
                    >
                      {playing
                        ? <img src={waveUrl} className="w-5 h-5 object-contain opacity-60 invert dark:invert-0" alt="" />
                        : <Play className="w-4 h-4" />}
                    </button>
                    <div className="flex flex-col items-end gap-1">
                      {isPop && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 ${accentText}`}>
                          {t.voices.mostUsed}
                        </span>
                      )}
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground`}>
                        {isFem ? t.voices.female : t.voices.male}
                      </span>
                    </div>
                  </div>

                  {/* Name + style + desc */}
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
                    onClick={() => handleCheckout(plan.id)}
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

        {/* ── 8. Final CTA ───────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 mb-16">
          <div className="cta-gradient rounded-2xl p-12 md:p-16 text-center relative overflow-hidden">
            {/* subtle noise / shine overlay */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.4)_0%,_transparent_70%)]" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white tracking-tight" style={{ fontFamily: "var(--font-headline)" }}>{t.cta.title}</h2>
              <p className="text-base mb-8 text-white/75 max-w-xl mx-auto">{t.cta.subtitle}</p>
              <button onClick={() => handleActionClick()} className="px-8 py-3 bg-white text-primary rounded-full text-sm font-bold hover:bg-white/90 hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all duration-200">
                {userId ? (lang === "ar" ? "الذهاب إلى لوحة التحكم" : "Go to Dashboard") : t.cta.primary}
              </button>
            </div>
          </div>
        </section>
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
            <a href="#"        className="hover:text-primary transition-colors duration-200">{t.footer.product}</a>
            <a href="#pricing" className="hover:text-primary transition-colors duration-200">{t.footer.pricing}</a>
            <a href="#"        className="hover:text-primary transition-colors duration-200">{t.footer.privacy}</a>
            <a href="#"        className="hover:text-primary transition-colors duration-200">{t.footer.terms}</a>
            <a href="#"        className="hover:text-primary transition-colors duration-200">{t.footer.contact}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
