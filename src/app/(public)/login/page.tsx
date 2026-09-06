import { redirect } from "next/navigation";
import { ShieldCheck, UserRound, LockKeyhole, HeartPulse, KeyRound, CheckCircle2 } from "lucide-react";
import { Brand } from "@/components/ui/brand";
import { getBootstrapState } from "@/modules/admin/rbac.service";
import { loginAction } from "@/modules/auth/actions";
import { getCurrentUser } from "@/modules/auth/session";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const bootstrapState = await getBootstrapState();
  if (!bootstrapState.hasUsers) redirect("/setup");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen">
      {/* Left Side (Branding & Info) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-blue-950 p-12 lg:flex xl:p-16">
        {/* Subtle background grid pattern */}
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
          <p className="mt-6 text-lg font-medium text-white/90">
            A simple, secure workspace for your pharmacy team.
          </p>

          <div className="mt-12 flex h-32 items-center">
            {/* ECG SVG Graphic with Heartbeat Animation */}
            <style>{`
              @keyframes heartbeat-draw {
                0% { stroke-dashoffset: 1000; }
                50% { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: 0; }
              }
              .ecg-line {
                stroke-dasharray: 1000;
                animation: heartbeat-draw 3s linear infinite;
              }
            `}</style>
            <svg viewBox="0 0 500 100" className="h-full w-full stroke-brand-default drop-shadow-[0_0_12px_rgba(40,114,240,0.6)]" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path className="ecg-line" d="M 0,50 L 100,50 L 120,20 L 140,80 L 150,50 L 250,50 L 270,10 L 300,90 L 320,50 L 400,50 L 420,30 L 440,70 L 450,50 L 500,50" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/20 pt-8 text-sm font-medium text-white/90">
          <div className="flex items-center gap-2"><ShieldCheck className="size-4" /> Secure sign-in</div>
          <div className="flex items-center gap-2"><KeyRound className="size-4" /> Staff access</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="size-4" /> Patient-first care</div>
        </div>
      </div>

      {/* Right Side (Login Form with Creative Medicine Loading Animation) */}
      <div className="flex w-full items-center justify-center bg-neutral-bg p-6 lg:w-1/2">
        <LoginForm error={error} />
      </div>
    </main>
  );
}
