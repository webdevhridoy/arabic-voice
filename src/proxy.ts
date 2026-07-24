import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export const proxy = clerkMiddleware(async (auth, req) => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // 1. Protect dashboard routes
  if (isProtectedRoute(req)) {
      await auth.protect();
  }

  // 2. Redirect root '/' to correct dynamic language path
  if (pathname === "/") {
      const acceptLanguage = req.headers.get("accept-language") || "";
      const prefersEnglish = acceptLanguage.toLowerCase().startsWith("en");
      const defaultLang = prefersEnglish ? "/en" : "/ar";
      return NextResponse.redirect(new URL(defaultLang, req.url));
  }

  // 3. Inject pathname header for server layouts
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
