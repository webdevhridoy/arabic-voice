"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const searchParams = useSearchParams();
  const forceRedirectUrl = searchParams.get("force_redirect_url") || undefined;
  const fallbackRedirectUrl = searchParams.get("fallback_redirect_url") || undefined;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <SignUp 
        forceRedirectUrl={forceRedirectUrl} 
        fallbackRedirectUrl={fallbackRedirectUrl}
      />
    </div>
  );
}
