import type { LucideIcon } from "lucide-react";

type SummaryCard = {
  label: string;
  value: string;
  hint?: string;
  tone?: "teal" | "emerald" | "blue" | "amber" | "red" | "violet" | "slate";
  icon?: LucideIcon;
};

const toneClasses = {
  teal: "bg-teal-50 text-teal-700",
  emerald: "bg-emerald-50 text-emerald-700",
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  violet: "bg-violet-50 text-violet-700",
  slate: "bg-slate-100 text-slate-600",
} as const;

export function FinanceSummaryCards({ cards }: { cards: SummaryCard[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, hint, icon: Icon, tone = "slate" }) => (
        <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,51,58,.05)]">
          {Icon ? (
            <div className={`grid size-11 place-items-center rounded-2xl ${toneClasses[tone]}`}>
              <Icon className="size-5" />
            </div>
          ) : (
            <div className={`size-11 rounded-2xl ${toneClasses[tone]}`} />
          )}
          <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
          {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
        </article>
      ))}
    </section>
  );
}
