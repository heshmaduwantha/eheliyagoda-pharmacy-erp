import { LogOut, RefreshCw } from "lucide-react";
import { Brand } from "@/components/ui/brand";
import { logoutAction } from "@/modules/auth/actions";
import type { CurrentUser } from "@/modules/auth/session";

export function UnderConstructionView({ user }: { user: CurrentUser }) {
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Columns for falling code animation
  const codeStreams = [
    {
      left: "4%",
      duration: "11s",
      delay: "0s",
      lines: [
        "import { erp } from '@/system';",
        "const STATUS = 'UNDER_CONSTRUCTION';",
        "01001001 01001110 01001001",
        "await database.migrate();",
        "// Upgrading pharmacy modules",
        "SELECT * FROM 'Stock' WHERE active = true;",
      ],
    },
    {
      left: "18%",
      duration: "14s",
      delay: "3s",
      lines: [
        "function syncInventory() {",
        "  return prisma.batch.updateMany();",
        "}",
        "BUILD_STATUS: IN_PROGRESS",
        "01010111 01000001 01010100",
        "<SystemMaintenance mode='active' />",
      ],
    },
    {
      left: "35%",
      duration: "9s",
      delay: "1.5s",
      lines: [
        "npm run build --release",
        "OPTIMIZING_POS_WORKSPACE...",
        "01100011 01101111 01100100 01100101",
        "const isUnderConstruction = true;",
        "// Deploying backend fixes",
      ],
    },
    {
      left: "62%",
      duration: "13s",
      delay: "4s",
      lines: [
        "CREATE INDEX idx_stock_batches;",
        "01010010 01000101 01000001 01000011 01010100",
        "await requirePermission('system.under_construction');",
        "// Refreshing server session",
        "HTTP/2.0 200 OK",
      ],
    },
    {
      left: "80%",
      duration: "10s",
      delay: "2s",
      lines: [
        "import { UnderConstruction } from '@/components';",
        "01000101 01010010 01010000",
        "const totalActiveUsers = await prisma.user.count();",
        "// Refactoring database pool",
        "git commit -m 'System Maintenance'",
      ],
    },
    {
      left: "93%",
      duration: "15s",
      delay: "5s",
      lines: [
        "SELECT pid, query FROM pg_stat_activity;",
        "01100011 01100001 01110100",
        "// Pharmacy ERP v2.0",
        "system.lockDownNavigation();",
        "process.env.DATABASE_URL",
      ],
    },
  ];

  return (
    <div className="relative min-h-screen bg-sky-100 flex flex-col justify-between selection:bg-sky-200 text-slate-800 font-sans overflow-hidden">
      {/* Falling Code Background Animation Layer */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-35 select-none">
        <style>{`
          @keyframes codeRain {
            0% { transform: translateY(-100%); opacity: 0; }
            15% { opacity: 0.8; }
            85% { opacity: 0.8; }
            100% { transform: translateY(105vh); opacity: 0; }
          }
          .animate-code-stream {
            animation: codeRain linear infinite;
          }
        `}</style>
        {codeStreams.map((stream, idx) => (
          <div
            key={idx}
            className="animate-code-stream absolute top-0 font-mono text-[11px] sm:text-xs font-semibold text-sky-700/60 leading-relaxed whitespace-nowrap"
            style={{
              left: stream.left,
              animationDuration: stream.duration,
              animationDelay: stream.delay,
            }}
          >
            {stream.lines.map((line, lineIdx) => (
              <div key={lineIdx} className="my-1.5 backdrop-blur-[1px]">
                {line}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Top Header */}
      <header className="relative z-50 border-b border-sky-200/80 bg-white/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Brand />
            <span className="hidden rounded-full bg-sky-200/70 px-3 py-1 text-xs font-bold text-sky-800 sm:inline-block">
              Under Construction
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1.5 shadow-sm">
              <div className="grid size-6 place-items-center rounded-full bg-sky-600 text-[11px] font-bold text-white">
                {initials}
              </div>
              <span className="text-xs font-bold text-slate-700 hidden sm:inline">{user.name}</span>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-700 shadow-sm transition hover:bg-rose-100 hover:border-rose-300"
              >
                <LogOut className="size-3.5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-8 text-center">
        {/* Main Artwork Container - ENLARGED Frame as requested */}
        <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-[#1e293b] shadow-2xl border-4 border-white/80 p-6 sm:p-12">
          {/* SVG Artwork Illustration - ENLARGED */}
          <div className="relative mx-auto w-full max-w-2xl">
            <svg
              viewBox="0 0 700 430"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto drop-shadow-lg select-none"
            >
              {/* Definitions & Animations */}
              <defs>
                {/* Light Beam Cone Gradient */}
                <linearGradient id="lightBeam" x1="350" y1="50" x2="350" y2="350" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#fef08a" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#fef08a" stopOpacity="0.05" />
                </linearGradient>

                {/* Glowing Lamp Gradient */}
                <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
              </defs>

              <style>{`
                @keyframes steamMove {
                  0% { transform: translateY(0) scaleX(1); opacity: 0.7; }
                  50% { transform: translateY(-12px) scaleX(1.15); opacity: 0.4; }
                  100% { transform: translateY(-24px) scaleX(1.3); opacity: 0; }
                }
                @keyframes catEarWiggle {
                  0%, 100% { transform: rotate(0deg); }
                  20% { transform: rotate(-4deg); }
                  40% { transform: rotate(4deg); }
                }
                @keyframes gearSpin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                @keyframes lightPulse {
                  0%, 100% { opacity: 0.95; }
                  50% { opacity: 0.8; }
                }
                .animate-steam-1 { animation: steamMove 2.5s infinite ease-out; transform-origin: center; }
                .animate-steam-2 { animation: steamMove 2.5s infinite ease-out 0.8s; transform-origin: center; }
                .animate-steam-3 { animation: steamMove 2.5s infinite ease-out 1.6s; transform-origin: center; }
                .animate-cat-ear { animation: catEarWiggle 4s infinite ease-in-out; transform-origin: bottom center; }
                .animate-gear { animation: gearSpin 6s linear infinite; transform-origin: 350px 292px; }
                .animate-light { animation: lightPulse 3s infinite ease-in-out; }
              `}</style>

              {/* 1. Light Cone extending down from lamp to desk */}
              <polygon points="350,55 170,350 530,350" fill="url(#lightBeam)" className="animate-light" />

              {/* 2. Left Wall Picture Frame */}
              <rect x="80" y="65" width="140" height="90" fill="#ffffff" rx="4" stroke="#cbd5e1" strokeWidth="4" />
              <rect x="90" y="75" width="120" height="70" fill="#f59e0b" rx="2" />
              {/* Pharmacy Cross / Emblem in Frame */}
              <circle cx="150" cy="110" r="18" fill="#ffffff" fillOpacity="0.9" />
              <path d="M145 110H155M150 105V115" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />

              {/* 3. Right Wall Bookshelf */}
              <line x1="470" y1="150" x2="610" y2="150" stroke="#cbd5e1" strokeWidth="5" strokeLinecap="round" />
              {/* Books */}
              <rect x="488" y="102" width="13" height="48" fill="#f97316" rx="1" />
              <line x1="494" y1="110" x2="494" y2="144" stroke="#ffffff" strokeWidth="2" />
              <rect x="504" y="96" width="15" height="54" fill="#ffffff" rx="1" />
              <circle cx="511" cy="110" fill="#f97316" r="3" />
              <circle cx="511" cy="125" fill="#f97316" r="3" />
              <rect x="522" y="105" width="13" height="45" fill="#ef4444" rx="1" />
              <rect x="538" y="98" width="16" height="52" fill="#ea580c" rx="1" transform="rotate(12 538 150)" />

              {/* 4. Hanging Lamp at Top */}
              <line x1="350" y1="0" x2="350" y2="25" stroke="#ea580c" strokeWidth="3" />
              <path d="M315 55 L350 25 L385 55 Z" fill="#ea580c" />
              <circle cx="350" cy="55" r="11" fill="#fef08a" />
              <circle cx="350" cy="55" r="20" fill="url(#lampGlow)" />

              {/* 5. Desk Surface */}
              <rect x="110" y="345" width="480" height="15" fill="#cbd5e1" rx="3" />
              <rect x="160" y="360" width="20" height="25" fill="#94a3b8" />
              <rect x="520" y="360" width="20" height="25" fill="#94a3b8" />

              {/* 6. Person behind Laptop */}
              {/* Hair */}
              <circle cx="370" cy="205" r="24" fill="#334155" /> {/* Ponytail */}
              <path d="M320 210 C320 165 380 165 380 210 Z" fill="#334155" />
              {/* Face */}
              <circle cx="350" cy="215" r="26" fill="#fbcfe8" />
              {/* Hair Bangs */}
              <path d="M328 198 C340 193 360 193 372 198 C367 207 333 207 328 198 Z" fill="#334155" />
              <rect x="352" y="182" width="9" height="13" fill="#f59e0b" rx="2" /> {/* Hair band */}
              {/* Eyes & Smile */}
              <circle cx="341" cy="215" r="2.5" fill="#334155" />
              <circle cx="359" cy="215" r="2.5" fill="#334155" />
              <path d="M343 226 Q350 233 357 226" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <ellipse cx="335" cy="222" rx="3.5" ry="2" fill="#f472b6" opacity="0.6" />
              <ellipse cx="365" cy="222" rx="3.5" ry="2" fill="#f472b6" opacity="0.6" />
              {/* Shirt */}
              <path d="M315 345 L328 250 L372 250 L385 345 Z" fill="#ea580c" />

              {/* 7. Laptop */}
              <rect x="285" y="245" width="130" height="100" fill="#ffffff" rx="6" stroke="#94a3b8" strokeWidth="3" />
              <rect x="293" y="253" width="114" height="84" fill="#f8fafc" rx="3" />
              {/* Animated Gear/Cross on Laptop Screen */}
              <circle cx="350" cy="295" r="11" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="4 2" className="animate-gear" />
              <circle cx="350" cy="295" r="4.5" fill="#94a3b8" />

              {/* Hands on Mouse/Keyboard */}
              <ellipse cx="265" cy="340" rx="9" ry="5.5" fill="#fbcfe8" />
              <rect x="252" y="337" width="13" height="8" fill="#cbd5e1" rx="2" /> {/* Mouse */}

              {/* 8. Items on Desk (Left) */}
              {/* Pen Container */}
              <rect x="150" y="312" width="26" height="33" fill="#ffffff" rx="3" stroke="#cbd5e1" strokeWidth="2" />
              <line x1="157" y1="295" x2="157" y2="312" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="163" y1="290" x2="163" y2="312" stroke="#ea580c" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="169" y1="298" x2="169" y2="312" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />
              {/* Plant / Vase */}
              <path d="M188 308 C185 285 203 285 200 308 Z" fill="#ef4444" />
              <path d="M194 345 L188 318 L200 318 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
              {/* Camera & Ruler */}
              <rect x="206" y="322" width="34" height="23" fill="#475569" rx="3" />
              <circle cx="223" cy="333" r="7" fill="#94a3b8" />
              <rect x="206" y="340" width="44" height="5" fill="#f59e0b" rx="1" />

              {/* 9. Steaming Coffee Mug (Right) */}
              <rect x="440" y="312" width="26" height="33" fill="#ea580c" rx="4" />
              <path d="M466 320 C475 320 475 336 466 336" stroke="#ea580c" strokeWidth="3.5" fill="none" />
              {/* Animated Steam Lines */}
              <path d="M445 302 Q447 295 445 286" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" fill="none" className="animate-steam-1" />
              <path d="M453 302 Q455 295 453 286" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" fill="none" className="animate-steam-2" />
              <path d="M461 302 Q463 295 461 286" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" fill="none" className="animate-steam-3" />

              {/* 10. Cute Cat Peeking over Desk (Right) */}
              <g className="animate-cat">
                {/* Cat Head */}
                <ellipse cx="515" cy="330" rx="27" ry="19" fill="#ffffff" />
                {/* Cat Ear Left */}
                <polygon points="493,317 502,295 510,313" fill="#334155" className="animate-cat-ear" />
                {/* Cat Ear Right */}
                <polygon points="520,313 528,295 537,317" fill="#334155" />
                {/* Patch */}
                <path d="M493 323 Q506 312 509 333 Z" fill="#334155" />
                {/* Nose & Whiskers */}
                <polygon points="513,330 517,330 515,333" fill="#ea580c" />
                <line x1="488" y1="331" x2="476" y2="328" stroke="#334155" strokeWidth="1.5" />
                <line x1="488" y1="334" x2="474" y2="334" stroke="#334155" strokeWidth="1.5" />
                <line x1="542" y1="331" x2="554" y2="328" stroke="#334155" strokeWidth="1.5" />
                <line x1="542" y1="334" x2="556" y2="334" stroke="#334155" strokeWidth="1.5" />
                {/* Paws on desk */}
                <ellipse cx="496" cy="344" rx="9" ry="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <ellipse cx="534" cy="344" rx="9" ry="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
              </g>
            </svg>
          </div>

          {/* Under Construction Status Pill */}
          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-400/30 px-5 py-2 text-xs font-bold text-amber-300">
            <RefreshCw className="size-4 animate-spin text-amber-400" style={{ animationDuration: "4s" }} />
            <span>Maintenance &amp; Upgrades In Progress</span>
          </div>
        </div>

        {/* Text Section matching reference image */}
        <div className="mt-8 max-w-2xl space-y-3">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-snug">
            Sorry, we&apos;re doing some construction work on the site
          </h1>
          <p className="text-xs sm:text-base font-medium text-slate-600 leading-relaxed">
            Thank you for being patient. We are doing some work on the system and will be back shortly.
          </p>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="relative z-10 py-4 text-center text-xs font-semibold text-slate-500 border-t border-sky-200/60 bg-sky-100/90 backdrop-blur-md">
        Eheliyagoda Pharmacy ERP © 2026 • Maintenance Mode
      </footer>
    </div>
  );
}
