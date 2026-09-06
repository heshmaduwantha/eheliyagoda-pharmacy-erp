"use client";

import { useEffect, useState } from "react";
import { LockKeyhole, ShieldCheck, UserRound, Sparkles } from "lucide-react";
import { loginAction } from "@/modules/auth/actions";

type Props = {
  error?: string;
};

export function LoginForm({ error }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  const loadingMessages = [
    "Authenticating credentials…",
    "Loading medicine catalog…",
    "Verifying security tokens…",
    "Preparing POS workspace…",
  ];

  useEffect(() => {
    if (!isSubmitting) return;
    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [isSubmitting]);

  const handleSubmit = () => {
    setIsSubmitting(true);
  };

  return (
    <>
      <div className="w-full max-w-[440px]">
        {/* Main Card */}
        <div className="rounded-[2rem] bg-neutral-surface p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] ring-1 ring-slate-100 sm:p-12">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-brand-pale text-brand-default">
              <UserRound className="size-7" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-neutral-text">Welcome back</h2>
            <p className="mt-2 text-sm font-medium text-neutral-muted">Sign in to your staff account</p>
          </div>

          {error === "invalid" && (
            <p role="alert" className="mt-6 rounded-xl bg-status-danger-bg p-4 text-center text-sm font-semibold text-status-danger-text ring-1 ring-red-200">
              Invalid username or password
            </p>
          )}

          <form action={loginAction} onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <div className="grid gap-2">
              <label className="text-sm font-bold text-neutral-text" htmlFor="username">Username</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-muted">
                  <UserRound className="size-5" />
                </div>
                <input
                  id="username"
                  name="username"
                  autoComplete="username"
                  required
                  placeholder="Your username"
                  className="w-full rounded-xl border border-neutral-border py-3.5 pl-11 pr-4 text-sm font-medium text-neutral-text outline-none transition-all focus:border-brand-default focus:ring-4 focus:ring-brand-default/20 placeholder:text-neutral-muted"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-bold text-neutral-text" htmlFor="password">Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-muted">
                  <LockKeyhole className="size-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Your password"
                  className="w-full rounded-xl border border-neutral-border py-3.5 pl-11 pr-4 text-sm font-medium text-neutral-text outline-none transition-all focus:border-brand-default focus:ring-4 focus:ring-brand-default/20 placeholder:text-neutral-muted"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 w-full rounded-xl bg-brand-default px-4 py-4 text-sm font-bold text-white transition-all hover:bg-brand-hover active:scale-[0.98] shadow-lg shadow-brand-default/25 disabled:opacity-75 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        {/* Info Banner Below */}
        <div className="mt-6 flex items-center gap-4 rounded-2xl bg-brand-pale p-5 ring-1 ring-brand-default/10">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-surface text-brand-default shadow-sm ring-1 ring-brand-default/10">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-hover">Staff sign-in</p>
            <p className="text-xs font-medium text-brand-default/80">Use your pharmacy account to continue.</p>
          </div>
        </div>
      </div>

      {/* FULL-SCREEN CREATIVE MEDICINE LOADING ANIMATION OVERLAY (LIGHT MODE) */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-slate-50/90 backdrop-blur-2xl text-slate-900">
          <style>{`
            @keyframes pill-float-1 {
              0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
              50% { transform: translate(-30px, -45px) rotate(25deg) scale(1.1); }
            }
            @keyframes pill-float-2 {
              0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
              50% { transform: translate(40px, -35px) rotate(-30deg) scale(1.15); }
            }
            @keyframes pill-float-3 {
              0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
              50% { transform: translate(-25px, 40px) rotate(45deg) scale(0.9); }
            }
            @keyframes pill-float-4 {
              0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
              50% { transform: translate(35px, 50px) rotate(-15deg) scale(1.05); }
            }
            @keyframes center-capsule-spin {
              0% { transform: rotate(0deg) scale(1); }
              50% { transform: rotate(180deg) scale(1.12); }
              100% { transform: rotate(360deg) scale(1); }
            }
            @keyframes progress-fill {
              0% { width: 5%; }
              50% { width: 65%; }
              100% { width: 95%; }
            }
            .animate-pill-1 { animation: pill-float-1 6.5s ease-in-out infinite; }
            .animate-pill-2 { animation: pill-float-2 7.5s ease-in-out infinite; }
            .animate-pill-3 { animation: pill-float-3 5.8s ease-in-out infinite; }
            .animate-pill-4 { animation: pill-float-4 7.0s ease-in-out infinite; }
            .animate-capsule-spin { animation: center-capsule-spin 4.5s ease-in-out infinite; }
            .animate-progress-fill { animation: progress-fill 5.5s ease-in-out forwards; }
          `}</style>

          {/* Ambient Colorful Pastel Background Glows */}
          <div className="absolute top-1/4 left-1/4 size-96 rounded-full bg-emerald-300/30 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 size-96 rounded-full bg-sky-300/30 blur-[120px] pointer-events-none" />
          <div className="absolute top-1/2 right-1/3 size-80 rounded-full bg-purple-300/30 blur-[100px] pointer-events-none" />

          {/* Floating Colorful Medicines across full light screen */}

          {/* Emerald Green Capsule - Top Left */}
          <div className="absolute top-[12%] left-[15%] opacity-90 animate-pill-1">
            <div className="flex h-12 w-28 items-center rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_12px_30px_rgba(16,185,129,0.35)] p-1 ring-1 ring-white/60">
              <div className="h-full w-1/2 rounded-l-full bg-emerald-200/50" />
              <div className="h-full w-1/2 rounded-r-full border-l border-white/50" />
            </div>
          </div>

          {/* Sky Blue & Cyan Capsule - Top Right */}
          <div className="absolute top-[18%] right-[18%] opacity-90 animate-pill-2">
            <div className="flex h-14 w-32 items-center rounded-full bg-gradient-to-r from-sky-400 to-blue-600 shadow-[0_14px_35px_rgba(56,189,248,0.35)] p-1 ring-1 ring-white/60">
              <div className="h-full w-1/2 rounded-l-full bg-cyan-100/50" />
              <div className="h-full w-1/2 rounded-r-full border-l border-white/50" />
            </div>
          </div>

          {/* Amber Gold Round Tablet - Middle Left */}
          <div className="absolute top-[48%] left-[10%] opacity-90 animate-pill-3">
            <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 shadow-[0_12px_30px_rgba(245,158,11,0.35)] ring-1 ring-white/60 relative">
              <div className="h-0.5 w-14 bg-white/60 rounded-full" />
            </div>
          </div>

          {/* Rose Pink Capsule - Bottom Right */}
          <div className="absolute bottom-[18%] right-[12%] opacity-90 animate-pill-4">
            <div className="flex h-12 w-28 items-center rounded-full bg-gradient-to-r from-rose-400 to-pink-600 shadow-[0_12px_30px_rgba(244,63,94,0.35)] p-1 ring-1 ring-white/60">
              <div className="h-full w-1/2 rounded-l-full bg-rose-100/50" />
              <div className="h-full w-1/2 rounded-r-full border-l border-white/50" />
            </div>
          </div>

          {/* Violet & Purple Capsule - Bottom Left */}
          <div className="absolute bottom-[15%] left-[22%] opacity-90 animate-pill-2">
            <div className="flex h-14 w-30 items-center rounded-full bg-gradient-to-r from-violet-400 to-purple-600 shadow-[0_14px_35px_rgba(139,92,246,0.35)] p-1 ring-1 ring-white/60">
              <div className="h-full w-1/2 rounded-l-full bg-purple-100/50" />
              <div className="h-full w-1/2 rounded-r-full border-l border-white/50" />
            </div>
          </div>

          {/* Yellow Round Pill - Top Center */}
          <div className="absolute top-[8%] right-[42%] opacity-85 animate-pill-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-[0_10px_25px_rgba(251,191,36,0.35)] ring-1 ring-white/60">
              <div className="h-0.5 w-10 bg-amber-700/30 rounded-full" />
            </div>
          </div>

          {/* Small Floating Micro Pills & Sparkles */}
          <div className="absolute top-[35%] right-[8%] size-8 rounded-full bg-teal-400/90 shadow-[0_6px_20px_rgba(45,212,191,0.4)] animate-pill-1 ring-1 ring-white/60" />
          <div className="absolute bottom-[35%] left-[6%] size-10 rounded-full bg-indigo-400/90 shadow-[0_8px_22px_rgba(129,140,248,0.4)] animate-pill-3 ring-1 ring-white/60" />

          {/* Central Glassmorphic Light Card */}
          <div className="relative z-10 mx-4 flex w-full max-w-md flex-col items-center rounded-3xl border border-slate-200/80 bg-white/85 p-8 text-center shadow-[0_25px_70px_-15px_rgba(15,23,42,0.15)] backdrop-blur-xl">
            {/* Spinning Multi-Color 3D Medicine Pill Centerpiece */}
            <div className="relative mb-6 flex size-24 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-default via-teal-400 to-sky-400 blur-xl opacity-40 animate-pulse" />
              <div className="animate-capsule-spin relative flex h-14 w-28 items-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 shadow-[0_10px_30px_rgba(56,189,248,0.5)] p-1 ring-2 ring-white">
                <div className="h-full w-1/2 rounded-l-full bg-white/40 backdrop-blur-xs flex items-center justify-center">
                  <div className="size-2.5 rounded-full bg-white" />
                </div>
                <div className="h-full w-1/2 rounded-r-full border-l border-white/50 flex items-center justify-center">
                  <Sparkles className="size-3.5 text-white" />
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-black tracking-tight text-slate-900">
              Signing into Medisquare
            </h3>

            <p className="mt-2 h-6 text-sm font-semibold text-slate-600 transition-all duration-300">
              {loadingMessages[loadingTextIndex]}
            </p>

            {/* Glowing Neon Progress Bar */}
            <div className="mt-6 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 ring-1 ring-slate-200">
              <div className="animate-progress-fill h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-600 shadow-[0_0_12px_rgba(40,114,240,0.5)]" />
            </div>

            <p className="mt-4 text-[11px] font-semibold text-slate-400">
              Pharmacy ERP • Secure Session Initialization
            </p>
          </div>
        </div>
      )}
    </>
  );
}
