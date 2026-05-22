import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/qadeyti/Logo";
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

  return (
    <div
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#050508] pb-24 text-foreground selection:bg-[var(--gold)] selection:text-black"
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
      <header className="relative z-10 mx-auto flex max-w-4xl items-center justify-between px-6 pt-6 mb-12">
        <Link to="/">
          <Logo className="h-8 w-auto" />
        </Link>
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 font-sans">
          Legal ID • ملف موثق
        </span>
      </header>

      {/* Card Wrapper Container */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mt-4 md:mt-12 animate-fade-in">
        <div className="rounded-[24px] border border-[#1E1E26] bg-[#0E0E12] p-8 md:p-12 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative overflow-hidden">
          {/* Visual Accent Glow */}
          <div className="absolute top-0 right-14 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>

          <div className="flex flex-col-reverse md:flex-row gap-8 lg:gap-12 items-center md:items-start text-center md:text-right">
            {/* Left section: Info & CTAs */}
            <div className="space-y-6 flex-1 w-full flex flex-col justify-between">
              <div>
                {/* Badges */}
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3.5 flex-wrap">
                  {p.bar_level && (
                    <span className="inline-flex items-center rounded-md bg-amber-500/10 px-3 py-1 text-xs font-bold text-[var(--gold)] border border-amber-500/20">
                      {p.bar_level}
                    </span>
                  )}
                  {p.years_experience != null && p.years_experience > 0 && (
                    <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-400 border border-indigo-500/15">
                      خبرة {p.years_experience} عامًا
                    </span>
                  )}
                </div>

                {/* Name & Title */}
                <h1 className="text-2xl sm:text-3xl font-black text-white font-display leading-[1.3] tracking-tight">
                  {p.title ? `${p.title} • ` : "الأستاذ المستشار • "}
                  {p.full_name}
                </h1>

                {/* Office Name */}
                {p.office_name && (
                  <p className="text-xs sm:text-sm text-slate-400 mt-2 font-mono tracking-wide">
                    {p.office_name}
                  </p>
                )}
              </div>

              {/* Bio Description */}
              {p.bio && (
                <p className="text-sm sm:text-[14.5px] text-slate-300 leading-relaxed max-w-2xl">
                  {p.bio}
                </p>
              )}

              {/* Specializations Tags */}
              {p.specializations?.length > 0 && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                  {p.specializations.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-[#181822] border border-slate-800/80 px-3.5 py-1.5 text-xs text-slate-300 font-medium transition-colors hover:border-[var(--gold)]/30"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Bottom Buttons Row */}
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3.5 pt-4">
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] text-black px-6 py-3 text-sm font-bold hover:brightness-105 active:scale-[0.98] transition-all"
                  >
                    <Phone className="h-4.5 w-4.5" />
                    تواصل عبر واتساب
                  </a>
                )}
                {p.office_address && (
                  <a
                    href={p.maps_link || "https://maps.google.com"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-xl border border-slate-800 bg-[#16161F]/80 text-sm font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all px-6 py-3"
                  >
                    <MapPin className="h-4.5 w-4.5 text-[var(--gold)]" />
                    {p.office_address}
                  </a>
                )}
              </div>
            </div>

            {/* Right section: Elegant Circular portrait or Gold scales */}
            <div className="shrink-0">
              <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-full border-[3px] border-[var(--gold)]/80 p-1.5 bg-[#12151D] flex items-center justify-center overflow-hidden relative group shadow-[0_0_30px_rgba(212,175,55,0.15)]">
                {p.avatar_url ? (
                  <img
                    src={p.avatar_url}
                    alt={p.full_name}
                    className="h-full w-full rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0A0A0F] text-[var(--gold)] transition-colors duration-300 group-hover:bg-[#12121A]">
                    {/* Custom elegant vector scales icon */}
                    <svg
                      className="h-14 w-14 sm:h-18 sm:w-18"
                      viewBox="0 0 64 64"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 24H52"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M32 14V48"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <circle cx="32" cy="11" r="2.5" fill="currentColor" />
                      <path
                        d="M22 48H42"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <path d="M27 48L32 41L37 48" fill="currentColor" opacity="0.8" />
                      <path d="M18 24L13 36M18 24L23 36" stroke="currentColor" strokeWidth="1.2" />
                      <path
                        d="M11 36H25"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M13 36C13 40 23 40 23 36"
                        stroke="currentColor"
                        strokeWidth="1"
                        fill="none"
                      />
                      <circle cx="18" cy="37" r="1.5" fill="#E2C175" />
                      <path d="M46 24L41 36M46 24L51 36" stroke="currentColor" strokeWidth="1.2" />
                      <path
                        d="M39 36H53"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M41 36C41 40 51 40 51 36"
                        stroke="currentColor"
                        strokeWidth="1"
                        fill="none"
                      />
                      <circle cx="46" cy="37" r="1.5" fill="#E2C175" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-16 pb-6 text-center">
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
          className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-black shadow-2xl ring-4 ring-[#25D366]/20 transition-transform hover:scale-110 active:scale-95"
        >
          <Phone className="h-6 w-6" />
        </a>
      )}
    </div>
  );
}
