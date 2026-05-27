import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Wallet, Plus, Search, ChevronLeft, TrendingUp, AlertCircle, Lock } from "lucide-react";
import { EmptyState } from "@/components/qadeyti/EmptyState";
import { StatCard } from "@/components/qadeyti/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { useTrial } from "@/hooks/use-trial";
import {
  PAYMENT_STATUSES,
  PAYMENT_STATUS_STYLES,
  fmtEGP,
  computeStatus,
  computeFinanceStats,
} from "@/lib/finance-constants";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  client_name: string;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  case_id: string | null;
  created_at: string;
  cases?: { title: string | null } | null;
  payment_installments?: {
    id: string;
    amount: number;
    due_date: string | null;
    status: string;
  }[];
};

export const Route = createFileRoute("/_app/finance/")({
  component: FinancePage,
});

function FinancePage() {
  const { limits } = useTrial();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!limits.hasFinancials) return;
    (async () => {
      const { data } = await supabase
        .from("payments")
        .select(
          `
          id,
          client_name,
          total_amount,
          paid_amount,
          payment_status,
          case_id,
          created_at,
          cases(title),
          payment_installments(id, amount, due_date, status)
        `,
        )
        .order("created_at", { ascending: false });

      const today = new Date().toISOString().slice(0, 10);
      const rowsWithLiveStatus = ((data as unknown as Row[]) ?? []).map((r) => {
        const hasOverdue = (r.payment_installments ?? []).some(
          (ins) => ins.status !== "مدفوع" && ins.due_date && ins.due_date < today,
        );
        const liveStatus = computeStatus(Number(r.total_amount), Number(r.paid_amount), hasOverdue);
        return {
          ...r,
          payment_status: liveStatus,
        };
      });

      setRows(rowsWithLiveStatus);
    })();
  }, []);

  const stats = useMemo(() => {
    const list = rows ?? [];
    const allInstallments = list.flatMap((r) => r.payment_installments ?? []);
    return computeFinanceStats(list, allInstallments);
  }, [rows]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const text = q.trim();
    return rows.filter((r) => {
      if (filter && r.payment_status !== filter) return false;
      if (!text) return true;
      const hay = `${r.client_name} ${r.cases?.title ?? ""}`;
      return hay.includes(text);
    });
  }, [rows, q, filter]);

  if (!limits.hasFinancials) {
    return (
      <div className="flex flex-col items-center justify-center py-14 px-4 text-center max-w-md mx-auto h-[70vh] space-y-6">
        <div className="bg-[var(--gold)]/15 border border-[var(--gold)]/30 rounded-2xl p-4 text-[var(--gold-soft)] shadow-md shadow-amber-500/5">
          <Lock className="h-10 w-10 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-foreground">
            النظام المالي وإدارة الأتعاب
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            تتبع أتعاب القضايا والموكلين، نظّم الأقساط بطريقة ذكية، واحصل على إحصائيات مالية متكاملة
            لمدفوعاتك ومستحقاتك المتأخرة.
          </p>
        </div>
        <div className="w-full bg-slate-900/40 rounded-xl border border-border p-4 text-right space-y-2.5">
          <p className="text-xs font-semibold text-[var(--gold-soft)] font-sans">
            خصائص النظام المالي المتقدم:
          </p>
          <ul className="text-xs space-y-2 text-muted-foreground font-sans">
            <li className="flex items-center gap-2">✓ إنشاء وتتبع الفواتير والأتعاب لكل قضية.</li>
            <li className="flex items-center gap-2">
              ✓ جدولة الأقساط وتلقي إشعارات بمتأخرات الدفع.
            </li>
            <li className="flex items-center gap-2">
              ✓ تقارير تفصيلية لتتبع الأرباح والإيرادات الإجمالية للمكتب.
            </li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          هذه الميزة متاحة فقط لـ{" "}
          <b className="text-[var(--gold-soft)] font-sans">الباقة الفردية للـمُحامي</b> أو أعلى.
          نشّط باقتك الآن لتتمكن من استخدامها.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">المالي</h1>
        <Link
          to="/finance/new"
          className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-b from-[var(--gold-soft)] to-[var(--gold)] px-3 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-gold"
        >
          <Plus className="h-4 w-4" /> دفعة جديدة
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="المحصّل"
          value={fmtEGP(stats.collected)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="المتبقي"
          value={fmtEGP(stats.remaining)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <div className="col-span-2">
          <StatCard
            label="متأخرات مستحقة"
            value={fmtEGP(stats.overdueTotal)}
            icon={<AlertCircle className="h-4 w-4 text-red-400" />}
          />
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث باسم الموكل أو القضية"
          className="h-12 w-full rounded-xl border border-border bg-card pr-10 pl-4 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[var(--gold)]"
        />
      </div>

      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-2">
          <Chip active={filter === null} onClick={() => setFilter(null)}>
            الكل
          </Chip>
          {PAYMENT_STATUSES.map((s) => (
            <Chip key={s} active={filter === s} onClick={() => setFilter(s)}>
              {s}
            </Chip>
          ))}
        </div>
      </div>

      {rows === null ? (
        <div className="space-y-3">
          <p className="text-center text-xs text-muted-foreground">جاري التحميل...</p>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-border bg-card/50"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-8 w-8" />}
          title={rows.length === 0 ? "لا توجد دفعات بعد" : "لا نتائج مطابقة"}
          description={rows.length === 0 ? "أضف أول دفعة لتتبع أتعابك." : "جرّب تغيير الفلتر."}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((p) => {
            const remaining = Math.max(Number(p.total_amount) - Number(p.paid_amount), 0);
            const style =
              PAYMENT_STATUS_STYLES[p.payment_status] ??
              "bg-secondary text-muted-foreground border-border";
            return (
              <li key={p.id}>
                <Link
                  to="/finance/$paymentId"
                  params={{ paymentId: p.id }}
                  className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-[var(--gold)]/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-base font-semibold text-foreground line-clamp-1">
                        {p.client_name}
                      </h3>
                      {p.cases?.title && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                          {p.cases.title}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn("rounded-lg border px-2.5 py-1 text-xs font-medium", style)}
                    >
                      {p.payment_status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">مدفوع</p>
                      <p className="font-semibold text-emerald-300">{fmtEGP(p.paid_amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">المتبقي</p>
                      <p className="font-semibold text-foreground">{fmtEGP(remaining)}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-end text-xs text-[var(--gold)]">
                    تفاصيل <ChevronLeft className="h-3.5 w-3.5" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition-colors",
        active
          ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
