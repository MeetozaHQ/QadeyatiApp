import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  MessageCircle,
  MapPin,
  Phone,
  Briefcase,
  BadgeCheck,
  Award,
  Scale,
  Clock,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/lawyer/$slug")({
  component: PublicProfile,
});

type LawyerProfile = {
  slug: string;
  full_name: string;
  title: string | null;
  bar_level: string | null;
  office_name: string | null;
  office_address: string | null;
  whatsapp: string | null;
  maps_link: string | null;
  bio: string | null;
  specializations: string[];
  years_experience: number | null;
  avatar_url: string | null;
};

const WA_MESSAGE = "مرحبًا، أريد الاستفسار بخصوص استشارة قانونية";

function PublicProfile() {
  const { slug } = Route.useParams();
  const [p, setP] = useState<LawyerProfile | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("lawyer_profiles")
        .select(
          "slug, full_name, title, bar_level, office_name, office_address, whatsapp, maps_link, bio, specializations, years_experience, avatar_url",
        )
        .eq("slug", slug)
        .maybeSingle();
      if (!data) setNotFound(true);
      else setP(data as LawyerProfile);
    })();
  }, [slug]);

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <Scale className="mb-4 h-10 w-10 text-[var(--gold)]/60" />
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          الملف غير موجود
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          قد يكون الرابط غير صحيح أو الملف غير منشور
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/30 px-5 py-2 text-sm text-[var(--gold)] transition-colors hover:bg-[color:var(--gold)]/10"
        >
          <ArrowLeft className="h-4 w-4" /> العودة للرئيسية
        </Link>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-pulse rounded-full bg-gradient-to-br from-[var(--gold-soft)] to-[var(--gold)] opacity-60" />
      </div>
    );
  }

  const waNumber = (p.whatsapp || "").replace(/[^\d]/g, "");
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(WA_MESSAGE)}`
    : null;
  const city = p.office_address?.split("،")[0]?.trim() || p.office_address?.split(",")[0]?.trim();

  return (
    <div
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#0A0A0F] pb-36 text-foreground"
    >
      {/* Ambient luxury background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[var(--gold)]/15 blur-[140px]" />
        <div className="absolute top-[40%] -right-32 h-[420px] w-[420px] rounded-full bg-[var(--gold)]/8 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(var(--gold) 1px, transparent 1px), linear-gradient(90deg, var(--gold) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* Top hairline */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/70 to-transparent" />

      {/* Brand strip */}
      <header className="relative z-10 mx-auto flex max-w-3xl items-center justify-between px-6 pt-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs uppercase tracking-[0.32em] text-[var(--gold-soft)]/80"
        >
          <Scale className="h-3.5 w-3.5" /> قضيتي
        </Link>
        <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70">
          Legal Identity
        </span>
      </header>

      {/* HERO */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 pt-12 pb-14 text-center animate-fade-in">
        <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/30 bg-white/[0.02] px-4 py-1.5 text-[10px] uppercase tracking-[0.32em] text-[var(--gold-soft)] backdrop-blur">
          <Sparkles className="h-3 w-3" /> مكتب محاماة معتمد
        </div>

        {/* Portrait */}
        <div className="relative mx-auto mb-10 h-40 w-40 sm:h-48 sm:w-48">
          <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-[var(--gold)]/40 via-transparent to-[var(--gold-soft)]/40 blur-2xl" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--gold)] via-[var(--gold-soft)] to-[var(--gold)] p-[1.5px]">
            <div className="h-full w-full overflow-hidden rounded-full bg-[#0A0A0F]">
              {p.avatar_url ? (
                <img src={p.avatar_url} alt={p.full_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#15151D] to-[#0A0A0F] font-display text-6xl font-bold text-[var(--gold)]">
                  {p.full_name[0]}
                </div>
              )}
            </div>
          </div>
          <div className="absolute -bottom-1 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#0A0A0F] bg-gradient-to-br from-[var(--gold)] to-[var(--gold-soft)] shadow-lg">
            <BadgeCheck className="h-5 w-5 text-[#0A0A0F]" />
          </div>
        </div>

        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
          {p.full_name}
        </h1>
        {p.title && (
          <p className="mt-4 bg-gradient-to-r from-[var(--gold-soft)] via-[var(--gold)] to-[var(--gold-soft)] bg-clip-text font-display text-lg font-medium text-transparent sm:text-xl">
            {p.title}
          </p>
        )}

        {/* Meta row */}
        <div className="mx-auto mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground">
          {p.bar_level && (
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--gold)]" />
              <span className="text-foreground/80">{p.bar_level}</span>
            </span>
          )}
          {p.years_experience != null && p.years_experience > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-[var(--gold)]" />
              <span className="text-foreground/80">{p.years_experience}+ سنة خبرة</span>
            </span>
          )}
          {city && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[var(--gold)]" />
              <span className="text-foreground/80">{city}</span>
            </span>
          )}
        </div>

        {/* Divider ornament */}
        <div className="mx-auto mt-10 flex items-center justify-center gap-3">
          <span className="h-px w-16 bg-gradient-to-l from-[var(--gold)]/60 to-transparent" />
          <span className="h-1.5 w-1.5 rotate-45 bg-[var(--gold)]" />
          <span className="h-px w-16 bg-gradient-to-r from-[var(--gold)]/60 to-transparent" />
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-3xl space-y-6 px-6">
        {/* BIO */}
        {p.bio && (
          <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-8 backdrop-blur-sm animate-fade-in">
            <span className="absolute right-6 top-6 font-display text-6xl leading-none text-[var(--gold)]/20">
              ”
            </span>
            <p className="relative text-lg leading-[2.1] text-foreground/85">{p.bio}</p>
          </section>
        )}

        {/* SPECIALIZATIONS */}
        {p.specializations?.length > 0 && (
          <section className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 animate-fade-in">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.24em] text-[var(--gold-soft)]">
                مجالات الممارسة
              </h2>
              <Briefcase className="h-4 w-4 text-[var(--gold)]/60" />
            </div>
            <div className="flex flex-wrap gap-2.5">
              {p.specializations.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-[var(--gold)]/25 bg-gradient-to-b from-[var(--gold)]/10 to-transparent px-4 py-2 text-sm font-medium text-foreground/90 transition-all hover:border-[var(--gold)]/50 hover:from-[var(--gold)]/15"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* CREDIBILITY STATS */}
        {(p.years_experience || p.bar_level) && (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 animate-fade-in">
            {p.years_experience != null && p.years_experience > 0 && (
              <StatTile
                value={`${p.years_experience}+`}
                label="سنوات الخبرة"
                icon={<Award className="h-4 w-4" />}
              />
            )}
            {p.bar_level && (
              <StatTile
                value={p.bar_level}
                label="درجة القيد"
                icon={<ShieldCheck className="h-4 w-4" />}
              />
            )}
            <StatTile value="موثّق" label="عبر قضيتي" icon={<BadgeCheck className="h-4 w-4" />} />
          </section>
        )}

        {/* OFFICE INFO */}
        {(p.office_name || p.office_address) && (
          <section className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 animate-fade-in">
            <h2 className="mb-6 font-display text-sm font-semibold uppercase tracking-[0.24em] text-[var(--gold-soft)]">
              المكتب
            </h2>
            <div className="space-y-5">
              {p.office_name && (
                <InfoRow
                  icon={<Briefcase className="h-4 w-4" />}
                  label="اسم المكتب"
                  value={p.office_name}
                />
              )}
              {p.office_address && (
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="العنوان"
                  value={p.office_address}
                />
              )}
              <InfoRow
                icon={<Clock className="h-4 w-4" />}
                label="ساعات العمل"
                value="الأحد – الخميس · 10ص – 6م"
              />
            </div>

            {p.maps_link && (
              <a
                href={p.maps_link}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-7 flex items-center justify-between rounded-2xl border border-[var(--gold)]/30 bg-gradient-to-l from-[var(--gold)]/10 to-transparent px-5 py-4 transition-all hover:border-[var(--gold)]/60 hover:from-[var(--gold)]/15"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--gold)]/15 text-[var(--gold)]">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <span className="font-display text-base font-semibold text-foreground">
                    فتح في خرائط Google
                  </span>
                </span>
                <ArrowLeft className="h-4 w-4 text-[var(--gold)] transition-transform group-hover:-translate-x-1" />
              </a>
            )}
          </section>
        )}

        {/* PRIMARY CTAs */}
        <section className="space-y-3 pt-2 animate-fade-in">
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex h-16 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1FB855] to-[#25D366] font-display text-base font-semibold text-white shadow-[0_20px_50px_-15px_rgba(37,211,102,0.5)] transition-transform active:scale-[0.98]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-l from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <MessageCircle className="h-5 w-5" />
              تواصل عبر واتساب
            </a>
          )}
          {waNumber && (
            <a
              href={`tel:+${waNumber}`}
              className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] font-display text-base font-medium text-foreground transition-colors hover:bg-white/[0.06]"
            >
              <Phone className="h-4 w-4 text-[var(--gold)]" />
              اتصال مباشر
            </a>
          )}
        </section>

        {/* Footer */}
        <div className="pt-12 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-[var(--gold)]/30" />
            <Scale className="h-4 w-4 text-[var(--gold)]/60" />
            <span className="h-px w-12 bg-[var(--gold)]/30" />
          </div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground/70">
            مُقدّم عبر <span className="text-[var(--gold)]">قضيتي</span>
          </p>
        </div>
      </div>

      {/* Floating WhatsApp */}
      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="واتساب"
          className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1FB855] to-[#25D366] text-white shadow-2xl ring-4 ring-[#25D366]/20 transition-transform hover:scale-110"
        >
          <MessageCircle className="h-6 w-6" />
        </a>
      )}
    </div>
  );
}

function StatTile({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent p-5 text-center transition-colors hover:border-[var(--gold)]/30">
      <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gold)]/10 text-[var(--gold)]">
        {icon}
      </div>
      <div className="font-display text-xl font-bold text-foreground">{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--gold)]/20 bg-[var(--gold)]/5 text-[var(--gold)]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <p className="mt-1 text-base text-foreground/90">{value}</p>
      </div>
    </div>
  );
}
