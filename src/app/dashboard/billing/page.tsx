"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getBillingData, getCustomerPortalUrl } from "@/actions/billing";
import { useDashboardLang } from "@/lib/dashboard-lang-context";
import {
  CheckCircle2, Crown, Zap, Sparkles, TrendingUp,
  BarChart3, Clock, CreditCard, Loader2, AlertCircle,
  Download, FileText, ExternalLink,
} from "lucide-react";

type BillingData = Awaited<ReturnType<typeof getBillingData>>;

const PLAN_META: Record<string, {
  icon: React.ReactNode; color: string; bgColor: string; label: string; labelEn: string;
}> = {
  free:       { icon: <Zap className="w-5 h-5" />,        color: "text-gray-400",   bgColor: "bg-gray-400/10",   label: "مجاني",    labelEn: "Free"       },
  starter:    { icon: <Zap className="w-5 h-5" />,        color: "text-yellow-400", bgColor: "bg-yellow-400/10", label: "المبتدئ",  labelEn: "Starter"    },
  pro:        { icon: <Crown className="w-5 h-5" />,      color: "text-[#7C5CFF]",  bgColor: "bg-[#7C5CFF]/10",  label: "المحترف", labelEn: "Pro"         },
  business:   { icon: <Sparkles className="w-5 h-5" />,   color: "text-[#20C7B7]",  bgColor: "bg-[#20C7B7]/10",  label: "الأعمال", labelEn: "Business"   },
  enterprise: { icon: <TrendingUp className="w-5 h-5" />, color: "text-orange-400", bgColor: "bg-orange-400/10", label: "المؤسسات", labelEn: "Enterprise" },
};

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C5CFF]" />
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const { lang } = useDashboardLang();
  
  const searchParams = useSearchParams();
  const upgraded     = searchParams.get("upgraded") === "true";
  const upgradedPlan = searchParams.get("plan") ?? "";

  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";

  useEffect(() => {
    getBillingData().then((d) => { setData(d); setLoading(false); });
  }, []);

  const handleManageBilling = async () => {
    setLoadingPortal(true);
    try {
      const url = await getCustomerPortalUrl();
      if (url) {
        window.open(url, "_blank");
      }
    } catch (err) {
      console.error("Portal error:", err);
      alert(isAr ? "فشل فتح بوابة الاشتراكات. يرجى المحاولة لاحقاً." : "Failed to open billing portal. Please try again later.");
    } finally {
      setLoadingPortal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C5CFF]" />
      </div>
    );
  }
  if (!data) return null;

  const { subscription, planId, planDef, invoices, usageRecords, usage } = data;
  const meta = PLAN_META[planId] ?? PLAN_META.free;
  const pct  = usage.limit > 0 ? Math.min((usage.currentUsage / usage.limit) * 100, 100) : 0;
  const barColor =
    pct >= 90 ? "from-red-500 to-orange-400" :
    pct >= 70 ? "from-yellow-500 to-orange-400" :
                "from-[#7C5CFF] to-[#20C7B7]";

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir={dir}>

      {/* ── Payment success banner ──────────────────────────── */}
      {upgraded && (
        <div className="flex items-center gap-3 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-2xl px-5 py-4 font-cairo animate-in fade-in slide-in-from-top-2 duration-500">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-teal-400" />
          <div className={`flex-1 ${isAr ? "text-right" : "text-left"}`}>
            <p className="font-bold text-sm">{isAr ? "تمت عملية الدفع بنجاح! 🎉" : "Upgrade successful! 🎉"}</p>
            <p className="text-xs text-teal-500/80 mt-0.5">
              {isAr ? (
                <>
                  تم تفعيل خطة{" "}
                  <span className="font-bold">{PLAN_META[upgradedPlan]?.label ?? upgradedPlan}</span>
                  {" "}— يمكنك الآن توليد الصوت بحدودك الجديدة.
                </>
              ) : (
                <>
                  The plan{" "}
                  <span className="font-bold">{PLAN_META[upgradedPlan]?.labelEn ?? upgradedPlan}</span>
                  {" "}has been activated. You can now generate voice with your new limits.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* ── Title ──────────────────────────────────────────── */}
      <div className={isAr ? "text-right" : "text-left"}>
        <h1 className="text-2xl font-bold font-cairo text-gray-900 dark:text-white">
          {isAr ? "الاشتراك والفواتير" : "Subscription & Billing"}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-cairo mt-1">
          {isAr ? "تفاصيل خطتك الحالية وسجل المدفوعات" : "Details of your current plan and payment history"}
        </p>
      </div>

      {/* ── Plan card ──────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#121936] rounded-2xl p-6 border border-gray-200 dark:border-white/5 shadow-xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${meta.bgColor} ${meta.color}`}>
              {meta.icon}
            </div>
            <div className={isAr ? "text-right" : "text-left"}>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-cairo mb-0.5">{isAr ? "الخطة الحالية" : "Current Plan"}</p>
              <p className={`text-xl font-bold font-cairo ${meta.color}`}>{isAr ? meta.label : meta.labelEn}</p>
              {planDef && (
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                  {planDef.chars.toLocaleString()} {isAr ? "حرف" : "chars"} · {isAr ? planDef.minutes.replace("minutes", "دقيقة") : planDef.minutes}
                </p>
              )}
            </div>
          </div>

          <div className={isAr ? "text-left" : "text-right"}>
            {planDef ? (
              <>
                <p className="text-3xl font-bold text-gray-900 dark:text-white font-mono">${(planDef.amount / 100).toFixed(2)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-cairo">{isAr ? "دفعة واحدة" : "One-time package"}</p>
              </>
            ) : (
              <span className="text-sm text-gray-500 dark:text-gray-400 font-cairo">{isAr ? "مجاناً" : "Free"}</span>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap border-t border-gray-100 dark:border-white/5 pt-4">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
              subscription?.status === "active"
                ? "bg-teal-500/10 text-teal-500 border border-teal-500/20"
                : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${subscription?.status === "active" ? "bg-teal-400 animate-pulse" : "bg-gray-400"}`} />
              {subscription?.status === "active" ? (isAr ? "نشط" : "Active") : (isAr ? "غير نشط" : "Inactive")}
            </span>
            {subscription?.paidAt && (
              <span className="text-[11px] text-gray-400 dark:text-gray-600 font-mono">
                {isAr ? "تاريخ الدفع: " : "Paid at: "}{new Date(subscription.paidAt).toLocaleDateString(isAr ? "ar-EG" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            )}
          </div>

          {planId !== "free" && (
            <button
              onClick={handleManageBilling}
              disabled={loadingPortal}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#7C5CFF] hover:bg-[#6843FC] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl transition-all duration-200 shadow-sm"
            >
              {loadingPortal ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {isAr ? "جاري التحميل..." : "Loading..."}
                </>
              ) : (
                <>
                  <ExternalLink className="w-3.5 h-3.5" />
                  {isAr ? "إدارة الاشتراك والمدفوعات" : "Manage Subscription & Billing"}
                </>
              )}
            </button>
          )}
        </div>
      </section>

      {/* ── Usage bar ──────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#121936] rounded-2xl p-6 border border-gray-200 dark:border-white/5 shadow-xl">
        <div className={`flex items-center gap-3 mb-5 ${isAr ? "justify-start" : "justify-start flex-row-reverse"}`}>
          <BarChart3 className="w-5 h-5 text-[#7C5CFF]" />
          <h2 className="font-bold font-cairo text-gray-900 dark:text-white">
            {isAr ? "استخدام الحروف" : "Character Usage"}
          </h2>
        </div>

        <div className="flex justify-between items-end mb-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {usage.currentUsage.toLocaleString()} {isAr ? "مستخدم" : "used"}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {usage.limit.toLocaleString()} {isAr ? "الحد الأقصى" : "limit"}
          </span>
        </div>

        <div className="h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            { value: usage.currentUsage.toLocaleString(), label: isAr ? "مستخدم" : "Used" },
            { value: usage.remaining.toLocaleString(), label: isAr ? "متبقي" : "Remaining", color: usage.remaining === 0 ? "text-red-400" : "text-teal-500" },
            { value: `${Math.round(pct)}%`, label: isAr ? "نسبة الاستخدام" : "Usage Rate" },
          ].map(({ value, label, color }) => (
            <div key={label} className="bg-gray-50 dark:bg-[#0B1020] rounded-xl p-3 border border-gray-100 dark:border-white/5 text-center">
              <p className={`text-lg font-bold font-mono ${color ?? "text-gray-900 dark:text-white"}`}>{value}</p>
              <p className="text-[11px] text-gray-500 font-cairo mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {!usage.allowed && (
          <div className="mt-4 flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm font-cairo">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              {isAr ? "انتهى حد الاستخدام — يرجى شراء باقة جديدة للحصول على المزيد." : "Usage limit reached — please purchase a new package to generate more."}
            </span>
          </div>
        )}
      </section>

      {/* ── Invoices table ─────────────────────────────────── */}
      <section className="bg-white dark:bg-[#121936] rounded-2xl p-6 border border-gray-200 dark:border-white/5 shadow-xl">
        <div className={`flex items-center gap-3 mb-5 ${isAr ? "justify-start" : "justify-start flex-row-reverse"}`}>
          <FileText className="w-5 h-5 text-[#7C5CFF]" />
          <h2 className="font-bold font-cairo text-gray-900 dark:text-white">
            {isAr ? "الفواتير (Invoices)" : "Invoices"}
          </h2>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-10 text-gray-400 font-cairo text-sm bg-gray-50 dark:bg-[#0B1020] rounded-xl border border-gray-100 dark:border-white/5">
            {isAr ? "لا توجد فواتير بعد — ستظهر هنا بعد أول عملية دفع" : "No invoices yet — they will appear here after your first payment"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className={`pb-3 text-xs text-gray-500 dark:text-gray-400 font-semibold font-cairo ${isAr ? "text-right" : "text-left"}`}>#</th>
                  <th className={`pb-3 text-xs text-gray-500 dark:text-gray-400 font-semibold font-cairo ${isAr ? "text-right" : "text-left"}`}>{isAr ? "الخطة" : "Plan"}</th>
                  <th className={`pb-3 text-xs text-gray-500 dark:text-gray-400 font-semibold font-cairo ${isAr ? "text-right" : "text-left"}`}>{isAr ? "المبلغ" : "Amount"}</th>
                  <th className={`pb-3 text-xs text-gray-500 dark:text-gray-400 font-semibold font-cairo ${isAr ? "text-right" : "text-left"}`}>{isAr ? "التاريخ" : "Date"}</th>
                  <th className={`pb-3 text-xs text-gray-500 dark:text-gray-400 font-semibold font-cairo ${isAr ? "text-right" : "text-left"}`}>{isAr ? "الفاتورة" : "Invoice"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {invoices.map((inv, i) => (
                  <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 text-gray-400 dark:text-gray-600 font-mono text-xs">{i + 1}</td>
                    <td className="py-3">
                      {inv.planId ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${PLAN_META[inv.planId]?.bgColor ?? "bg-gray-100/10"} ${PLAN_META[inv.planId]?.color ?? "text-gray-400"}`}>
                          {PLAN_META[inv.planId]?.labelEn ?? inv.planId}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      {inv.amount != null ? (
                        <span className="font-mono font-bold text-gray-900 dark:text-white">${inv.amount.toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs font-mono">
                          {new Date(inv.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                            year: "numeric", month: "short", day: "numeric",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      {inv.receiptUrl ? (
                        <a
                          href={inv.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C5CFF] hover:text-[#9B82FF] bg-[#7C5CFF]/10 hover:bg-[#7C5CFF]/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          {isAr ? "تحميل" : "Download"}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-600 font-cairo">{isAr ? "غير متاح" : "N/A"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Usage log ──────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#121936] rounded-2xl p-6 border border-gray-200 dark:border-white/5 shadow-xl">
        <div className={`flex items-center gap-3 mb-5 ${isAr ? "justify-start" : "justify-start flex-row-reverse"}`}>
          <CreditCard className="w-5 h-5 text-[#7C5CFF]" />
          <h2 className="font-bold font-cairo text-gray-900 dark:text-white">
            {isAr ? "سجل الاستخدام" : "Usage Log"}
          </h2>
        </div>

        {usageRecords.length === 0 ? (
          <div className="text-center py-10 text-gray-400 font-cairo text-sm bg-gray-50 dark:bg-[#0B1020] rounded-xl border border-gray-100 dark:border-white/5">
            {isAr ? "لا يوجد سجل استخدام حتى الآن" : "No usage history yet"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className={`pb-3 text-xs text-gray-500 dark:text-gray-400 font-semibold font-cairo pr-2 ${isAr ? "text-right" : "text-left"}`}>#</th>
                  <th className={`pb-3 text-xs text-gray-500 dark:text-gray-400 font-semibold font-cairo ${isAr ? "text-right" : "text-left"}`}>{isAr ? "حروف مستخدمة" : "Characters Used"}</th>
                  <th className={`pb-3 text-xs text-gray-500 dark:text-gray-400 font-semibold font-cairo ${isAr ? "text-right" : "text-left"}`}>{isAr ? "المزود" : "Provider"}</th>
                  <th className={`pb-3 text-xs text-gray-500 dark:text-gray-400 font-semibold font-cairo ${isAr ? "text-right" : "text-left"}`}>{isAr ? "التاريخ" : "Date"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {usageRecords.map((record, i) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pr-2 text-gray-400 dark:text-gray-600 font-mono text-xs">{i + 1}</td>
                    <td className="py-3">
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">{record.charactersUsed.toLocaleString()}</span>
                      <span className="text-xs text-gray-400 mr-1 font-cairo">{isAr ? "حرف" : "chars"}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-xs bg-[#7C5CFF]/10 text-[#7C5CFF] px-2 py-0.5 rounded-full font-mono capitalize">{record.provider}</span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs font-mono">
                          {new Date(record.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                            year: "numeric", month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}
