import type { ReportDateRange, ReportType } from "@/modules/reports/report.types";

const reportOptions: { value: ReportType; label: string }[] = [
  { value: "daily-sales", label: "Sales summary" },
  { value: "cash-card", label: "Cash vs card" },
  { value: "product-sales", label: "Sales by product" },
  { value: "gross-profit", label: "Gross profit" },
  { value: "stock-valuation", label: "Stock value" },
  { value: "low-stock", label: "Low stock" },
  { value: "near-expiry", label: "Expiring soon" },
  { value: "expired-quarantined", label: "Expired stock" },
  { value: "supplier-payables", label: "What you owe suppliers" },
  { value: "supplier-payments", label: "Payments made" },
  { value: "expenses", label: "Expenses" },
  { value: "controlled-drugs", label: "Controlled drugs register" },
];

export function ReportFilter({ type, range }: { type: ReportType; range: ReportDateRange }) {
  return (
    <form className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto] lg:items-end">
      <label className="grid gap-1.5 text-sm font-medium text-neutral-text">
        Report type
        <select
          className="rounded-xl border border-neutral-border bg-neutral-surface px-3 py-2.5 text-sm outline-none focus:border-brand-default"
          defaultValue={type}
          name="type"
        >
          {reportOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-neutral-text">
        From
        <input
          className="rounded-xl border border-neutral-border px-3 py-2.5 text-sm outline-none focus:border-brand-default"
          defaultValue={range.from}
          name="from"
          type="date"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-neutral-text">
        To
        <input
          className="rounded-xl border border-neutral-border px-3 py-2.5 text-sm outline-none focus:border-brand-default"
          defaultValue={range.to}
          name="to"
          type="date"
        />
      </label>
      <button
        className="rounded-xl bg-brand-default px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-default"
        type="submit"
      >
        Apply
      </button>
    </form>
  );
}
