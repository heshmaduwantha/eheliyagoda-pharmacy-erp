import Link from "next/link";
import { AlertTriangle, ArrowRight, Boxes, FileCheck2, PackageCheck, ReceiptText, ShoppingCart, Truck, WalletCards } from "lucide-react";

const nodes = [
  { label: "Setup", href: "/training/modules/products", icon: FileCheck2 },
  { label: "Supplier", href: "/training/modules/suppliers", icon: Truck },
  { label: "GRN", href: "/training/modules/grn", icon: PackageCheck },
  { label: "Batch Stock", href: "/training/scenarios/fefo", icon: Boxes },
  { label: "Supplier Payable", href: "/training/scenarios/supplier-payment", icon: ReceiptText },
  { label: "POS Sale", href: "/training/modules/pos", icon: ShoppingCart },
  { label: "Payment", href: "/training/scenarios/supplier-payment", icon: WalletCards },
  { label: "Reports", href: "/training/modules/reports", icon: ReceiptText },
];

export function BusinessCycleMap() {
  return (
    <section aria-labelledby="business-cycle-title" className="min-w-0 max-w-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="text-xl font-black text-slate-900" id="business-cycle-title">Pharmacy business cycle</h2><p className="mt-1 text-sm text-slate-500">Node එකක් තෝරා අදාල පාඩමට යන්න.</p></div>
        <p className="text-xs font-bold uppercase tracking-[.16em] text-teal-700">Stock + money flow</p>
      </div>
      <div className="mt-6 flex min-w-0 max-w-full snap-x gap-2 overflow-x-auto pb-2">
        {nodes.map(({ label, href, icon: Icon }, index) => (
          <div className="flex shrink-0 items-center gap-2 xl:min-w-0 xl:flex-1 xl:shrink" key={label}>
            <Link className="group grid min-w-28 snap-start place-items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs font-bold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 xl:min-w-0 xl:flex-1" href={href}>
              <span className="grid size-10 place-items-center rounded-full bg-white text-teal-700 shadow-sm"><Icon className="size-5" /></span>{label}
            </Link>
            {index < nodes.length - 1 ? <ArrowRight className="size-4 text-slate-300" /> : null}
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
        <p className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-amber-900"><strong>PO:</strong> Current app එකේ unavailable.</p>
        <p className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-900"><strong>Confirmed GRN:</strong> Stock වැඩි කරයි.</p>
        <p className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-rose-900"><strong>Completed Sale:</strong> Stock අඩු කරයි.</p>
      </div>
      <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />Expired stock auto-quarantine/write-off action current UI එකේ නැත; guide එක එය available බව නොපෙන්වයි.</p>
    </section>
  );
}
