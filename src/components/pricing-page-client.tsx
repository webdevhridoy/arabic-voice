"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { LandingPageTemplate } from "@/components/landing-page-template";
import { type Lang } from "@/lib/translations";

interface PricingPageClientProps {
  lang: Lang;
}

export function PricingPageClient({ lang }: PricingPageClientProps) {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Reset pricing button loading state when browser restores page from BFCache
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

  return (
    <LandingPageTemplate
      lang={lang}
      loadingPlan={loadingPlan}
      onCheckout={handleCheckout}
      onActionClick={handleActionClick}
      userId={userId}
      isLoaded={isLoaded}
      onlyPricing={true}
    />
  );
}
