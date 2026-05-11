"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import useSWR from "swr";
import { getUserUsageStats } from "@/actions/generations";
import { checkIsAdmin } from "@/actions/admin";
import { ModeToggle } from "@/components/mode-toggle";
import { DashboardLangToggle } from "@/components/dashboard-lang-toggle";
import { DashboardLangProvider, useDashboardLang } from "@/lib/dashboard-lang-context";
import { Mic2, History, CreditCard, Settings, ShieldAlert } from "lucide-react";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { lang } = useDashboardLang();
  const dir = lang === "ar" ? "rtl" : "ltr";

  const { data: usage } = useSWR("layout-usage", () => getUserUsageStats(), { revalidateOnFocus: false });
  const { data: isAdmin } = useSWR("layout-check-admin", () => checkIsAdmin(), { revalidateOnFocus: false });

  const links = [
    { name: "المولد (Generator)", short: "المولد", href: "/dashboard", icon: Mic2 },
    { name: "السجل (History)", short: "السجل", href: "/dashboard/history", icon: History },
    { name: "الفواتير (Billing)", short: "الفواتير", href: "/dashboard/billing", icon: CreditCard },
    { name: "الإعدادات (Settings)", short: "الإعدادات", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0B1020] text-gray-900 dark:text-gray-100 transition-colors" dir={dir}>
      <aside className="w-64 border-l border-gray-200 dark:border-white/5 bg-white dark:bg-[#121936] p-6 hidden md:flex flex-col z-10 shadow-lg transition-colors">
        <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
          <h2 className="text-xl font-bold font-cairo mb-8 text-gray-900 dark:text-white flex items-center gap-2">Sawti <span className="text-[#7C5CFF]">صَوتِي</span></h2>
        </Link>
        
        <nav className="space-y-2 flex-1 flex flex-col">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                className={`flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg transition-colors font-cairo ${
                  isActive 
                    ? 'text-[#20C7B7] bg-[#20C7B7]/10 border-r-2 border-[#20C7B7]' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5 ml-3" />
                {link.name}
              </Link>
            );
          })}

          {isAdmin && (
            <Link 
              href="/admin" 
              className={`flex items-center mt-auto space-x-3 space-x-reverse px-4 py-3 rounded-lg transition-colors font-cairo font-semibold tracking-wide ${
                pathname?.startsWith('/admin') 
                  ? 'text-[#7C5CFF] bg-[#7C5CFF]/10 border-r-2 border-[#7C5CFF]' 
                  : 'text-[#7C5CFF] hover:bg-[#7C5CFF]/10'
              }`}
            >
              <ShieldAlert className="w-5 h-5 ml-3" />
              لوحة المشرف (Admin)
            </Link>
          )}
        </nav>
        
        {/* Usage Area */}
        <div className="mt-8 bg-gray-50 dark:bg-[#0B1020] p-4 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm transition-colors">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-gray-600 dark:text-gray-400 font-cairo">الاستهلاك</span>
            <span className="font-mono text-xs font-medium text-gray-900 dark:text-gray-300">{usage?.currentUsage?.toLocaleString() || 0} / {usage?.limit?.toLocaleString() || 0}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-[#121936] rounded-full h-1.5 overflow-hidden transition-colors">
            <div 
              className="bg-gradient-to-l from-[#7C5CFF] to-[#20C7B7] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((usage?.currentUsage || 0) / (usage?.limit || 1)) * 100)}%` }}
            />
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative pb-16 md:pb-0">
        <header className="h-16 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-6 bg-white/90 dark:bg-[#0B1020]/80 backdrop-blur-md sticky top-0 z-20 transition-colors">
          <h1 className="text-lg font-cairo text-gray-900 dark:text-white font-bold">لوحة التحكم (Dashboard)</h1>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <DashboardLangToggle />
            <UserButton />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Navigation Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#121936]/90 backdrop-blur-md border-t border-gray-200 dark:border-white/5 z-30 flex justify-around items-center px-2 py-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors" dir={dir}>
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`flex flex-col items-center justify-center p-2 min-w-[64px] rounded-xl transition-all duration-200 font-cairo ${
                isActive 
                  ? 'text-[#20C7B7]' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className={`p-1.5 rounded-full mb-1 transition-colors ${isActive ? 'bg-[#20C7B7]/10' : 'bg-transparent'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium leading-none">{link.short}</span>
            </Link>
          );
        })}
        {isAdmin && (
          <Link 
            href="/admin" 
            className={`flex flex-col items-center justify-center p-2 min-w-[64px] rounded-xl transition-all duration-200 font-cairo ${
              pathname?.startsWith('/admin') 
                ? 'text-[#7C5CFF]' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className={`p-1.5 rounded-full mb-1 transition-colors ${pathname?.startsWith('/admin') ? 'bg-[#7C5CFF]/10' : 'bg-transparent'}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium leading-none">المشرف</span>
          </Link>
        )}
      </nav>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLangProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </DashboardLangProvider>
  );
}


