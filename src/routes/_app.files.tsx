import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, FileText, Image as ImageIcon, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { EmptyState } from "@/components/qadeyti/EmptyState";
import { FILE_CATEGORIES, formatBytes } from "@/lib/file-constants";
import { cn } from "@/lib/utils";
import { useTrial } from "@/hooks/use-trial";

export const Route = createFileRoute("/_app/files")({
  component: FilesPage,
});

interface Row {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  category: string;
  uploaded_at: string;
  case_id: string;
  case_title?: string | null;
}

function FilesPage() {
  const { user } = useAuth();
  const { simulatedLawyerId, firmLawyers } = useTrial();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("الكل");
  const [selectedLawyerId, setSelectedLawyerId] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("case_attachments")
        .select("id,file_name,file_url,file_type,file_size,category,uploaded_at,case_id")
        .order("uploaded_at", { ascending: false })
        .limit(200);
      let list = (data as Row[]) ?? [];
      const ids = Array.from(new Set(list.map((r) => r.case_id)));
      if (ids.length) {
        const { data: cs } = await supabase
          .from("cases")
          .select("id,title,assigned_lawyer_id")
          .in("id", ids);
        const map = new Map((cs ?? []).map((c) => [c.id, c]));

        // Determine currently effective lawyer ID filter
        const activeFilter = simulatedLawyerId !== "owner" ? simulatedLawyerId : selectedLawyerId;

        // Filter by simulated lawyer if active
        if (activeFilter && activeFilter !== "owner" && activeFilter !== "all") {
          list = list.filter((r) => {
            const c = map.get(r.case_id);
            if (!c || !c.assigned_lawyer_id) return false;
            const assignedIds = c.assigned_lawyer_id.split(",").filter(Boolean);
            return assignedIds.includes(activeFilter);
          });
        }

        list.forEach((r) => (r.case_title = map.get(r.case_id)?.title ?? null));
      } else {
        list = [];
      }
      setRows(list);
    })();
  }, [user, simulatedLawyerId, selectedLawyerId]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (cat !== "الكل" && r.category !== cat) return false;
      if (!needle) return true;
      return (
        r.file_name.toLowerCase().includes(needle) ||
        (r.case_title ?? "").toLowerCase().includes(needle) ||
        r.category.toLowerCase().includes(needle)
      );
    });
  }, [rows, q, cat]);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-foreground">الملفات الأخيرة</h1>
        <p className="text-sm text-muted-foreground">كل وثائق قضاياك في مكان واحد</p>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث باسم الملف، القضية، أو التصنيف..."
          className="h-12 w-full rounded-xl border border-border bg-card pr-10 pl-4 text-foreground outline-none focus:border-[var(--gold)]"
        />
      </div>

      {simulatedLawyerId === "owner" && firmLawyers && firmLawyers.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-3">
          <label className="text-[11px] font-bold text-muted-foreground">
            عرض الملفات والمستندات الخاصة بالمحامي:
          </label>
          <select
            value={selectedLawyerId}
            onChange={(e) => setSelectedLawyerId(e.target.value)}
            className="h-10 rounded-xl border border-border bg-[#0a0f1d] px-3 text-xs text-foreground outline-none focus:border-[var(--gold)] cursor-pointer font-sans"
          >
            <option value="all">📁 عرض كل مستندات المكتب (الكل)</option>
            {firmLawyers.map((l) => (
              <option key={l.id} value={l.id}>
                👤 {l.name} ({l.role})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["الكل", ...FILE_CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              cat === c
                ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]"
                : "border-border text-muted-foreground hover:border-[var(--gold)]/40",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered === null ? (
        <div className="h-24 animate-pulse rounded-2xl border border-border bg-card/50" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Paperclip className="h-7 w-7" />}
          title="لا توجد ملفات"
          description="ارفع وثائق من داخل أي قضية لتظهر هنا."
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((r) => {
            const isImg = (r.file_type ?? "").startsWith("image/");
            return (
              <li key={r.id}>
                <Link
                  to="/cases/$caseId"
                  params={{ caseId: r.case_id }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-[var(--gold)]/40"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--gold)]/10 text-[var(--gold-soft)]">
                    {isImg ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{r.file_name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded-md border border-[var(--gold)]/30 px-1.5 py-0.5 text-[var(--gold-soft)]">
                        {r.category}
                      </span>
                      {r.case_title && <span className="truncate">{r.case_title}</span>}
                      <span>{new Date(r.uploaded_at).toLocaleDateString("ar-EG")}</span>
                      <span>{formatBytes(r.file_size)}</span>
                    </div>
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
