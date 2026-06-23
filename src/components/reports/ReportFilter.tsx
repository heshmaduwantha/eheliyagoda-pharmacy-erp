import type { ReportDateRange, ReportType } from "@/modules/reports/report.types";

const reportOptions: { value: ReportType; label: string }[] = [
  { value: "daily-sales", label: "Daily sales" },
  { value: "cash-card", label: "Cash vs card" },
  { value: "product-sales", label: "Product-wise sales" },
  { value: "gross-profit", label: "Gross profit" },
  { value: "stock-valuation", label: "Stock valuation" },
  { value: "low-stock", label: "Low stock" },
  { value: "near-expiry", label: "Near expiry" },
  { value: "expired-quarantined", label: "Expired / quarantined" },
  { value: "supplier-payables", label: "Supplier payables" },
  { value: "supplier-payments", label: "Supplier payments" },
  { value: "expenses", label: "Expenses" },
  { value: "controlled-drugs", label: "Controlled drug register" },
];

export function ReportFilter({ type, range }: { type: ReportType; range: ReportDateRange }) {
  return <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto_auto] lg:items-end"><label className="grid gap-1.5 text-sm font-bold text-slate-700">Report type<select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-500" defaultValue={type} name="type">{reportOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label className="grid gap-1.5 text-sm font-bold text-slate-700">From<input className="rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-500" defaultValue={range.from} name="from" type="date" /></label><label className="grid gap-1.5 text-sm font-bold text-slate-700">To<input className="rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-500" defaultValue={range.to} name="to" type="date" /></label><button className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-800" type="submit">View report</button><button className="cursor-not-allowed rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-400" disabled title="CSV export is not implemented" type="button">CSV pending</button></form>;
}
