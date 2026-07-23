import { redirect } from "next/navigation";
import { ShieldCheck, UserRound, LockKeyhole, HeartPulse, KeyRound, CheckCircle2 } from "lucide-react";
import { Brand } from "@/components/ui/brand";
import { getBootstrapState } from "@/modules/admin/rbac.service";
import { loginAction } from "@/modules/auth/actions";
import { getCurrentUser } from "@/modules/auth/session";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const bootstrapState = await getBootstrapState();
  if (!bootstrapState.hasUsers) redirect("/setup");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen">
      {/* Left Side (Branding & Info) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-hover to-brand-default p-12 lg:flex xl:p-16">
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

        <div className="relative z-10">
          <Brand inverse={true} />
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-neutral-surface/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md">
            <HeartPulse className="size-4" /> Patient-first care
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white xl:text-6xl">
            Medisquare <br /> Pharmacy + Clinic
          </h1>
          <p className="mt-6 text-lg font-medium text-brand-default">
            A simple, secure workspace for your pharmacy team.
          </p>

          <div className="mt-12 flex h-32 items-center">
            {/* ECG SVG Graphic */}
            <svg viewBox="0 0 500 100" className="h-full w-full stroke-brand-pale drop-shadow-[0_0_8px_rgba(40,114,240,0.8)]" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 0,50 L 100,50 L 120,20 L 140,80 L 150,50 L 250,50 L 270,10 L 300,90 L 320,50 L 400,50 L 420,30 L 440,70 L 450,50 L 500,50" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/20 pt-8 text-sm font-medium text-brand-default">
          <div className="flex items-center gap-2"><ShieldCheck className="size-4" /> Secure sign-in</div>
          <div className="flex items-center gap-2"><KeyRound className="size-4" /> Staff access</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="size-4" /> Patient-first care</div>
        </div>
      </div>

      {/* Right Side (Login Form) */}
      <div className="flex w-full items-center justify-center bg-neutral-bg p-6 lg:w-1/2">
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

            <form action={loginAction} className="mt-8 grid gap-5">
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
                    className="w-full rounded-xl border border-neutral-border py-3.5 pl-11 pr-4 text-sm font-medium text-neutral-text outline-none transition-all focus:border-brand-default focus:ring-4 focus:ring-brand-default/50/10 placeholder:text-neutral-muted"
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
                    className="w-full rounded-xl border border-neutral-border py-3.5 pl-11 pr-4 text-sm font-medium text-neutral-text outline-none transition-all focus:border-brand-default focus:ring-4 focus:ring-brand-default/50/10 placeholder:text-neutral-muted"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 w-full rounded-xl bg-brand-default px-4 py-4 text-sm font-bold text-white transition-all hover:bg-brand-default active:scale-[0.98] shadow-lg shadow-teal-500/25"
              >
                Sign in
              </button>
            </form>
          </div>

          {/* Info Banner Below */}
          <div className="mt-6 flex items-center gap-4 rounded-2xl bg-status-success-bg/80 p-5 ring-1 ring-emerald-100">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-surface text-status-success-text shadow-sm ring-1 ring-emerald-100">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-950">Staff sign-in</p>
              <p className="text-xs font-medium text-status-success-text/80">Use your pharmacy account to continue.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

