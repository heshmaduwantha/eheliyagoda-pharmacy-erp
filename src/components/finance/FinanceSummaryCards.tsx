import type { LucideIcon } from "lucide-react";

type SummaryCard = {
  label: string;
  value: string;
  hint?: string;
  tone?: "teal" | "emerald" | "blue" | "amber" | "red" | "violet" | "slate";
  icon?: LucideIcon;
};

const toneClasses = {
  teal: "bg-brand-pale text-brand-default",
  emerald: "bg-status-success-bg text-status-success-text",
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-status-warning-bg text-status-warning-text",
  red: "bg-status-danger-bg text-status-danger-text",
  violet: "bg-violet-50 text-violet-700",
  slate: "bg-slate-100 text-neutral-muted",
} as const;

export function FinanceSummaryCards({ cards }: { cards: SummaryCard[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, hint, icon: Icon, tone = "slate" }) => (
        <article key={label} className="rounded-2xl border border-neutral-border bg-neutral-surface p-5 shadow-[0_8px_30px_rgba(15,51,58,.05)]">
          {Icon ? (
            <div className={`grid size-11 place-items-center rounded-2xl ${toneClasses[tone]}`}>
              <Icon className="size-5" />
            </div>
          ) : (
            <div className={`size-11 rounded-2xl ${toneClasses[tone]}`} />
          )}
          <p className="mt-5 text-sm font-medium text-neutral-muted">{label}</p>
          <p className="mt-1 text-2xl font-black text-neutral-text">{value}</p>
          {hint ? <p className="mt-2 text-xs text-neutral-muted">{hint}</p> : null}
        </article>
      ))}
    </section>
  );
}
