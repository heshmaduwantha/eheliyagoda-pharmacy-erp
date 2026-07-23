import type { InventoryProductSummaryRecord } from "@/modules/inventory/inventory.types";
import { formatInventoryQty } from "@/modules/inventory/inventory.utils";

function batchLabel(count: number) {
  return `${count} ${count === 1 ? "batch" : "batches"}`;
}

export function ProductStockOverviewTable({ rows }: { rows: InventoryProductSummaryRecord[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,51,58,.05)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              {['Product', 'Active stock', 'Removed / unavailable'].map((heading) => (
                <th className="border-b border-slate-200 px-5 py-4 font-bold" key={heading}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((product) => (
              <tr className="hover:bg-teal-50/30" key={product.id}>
                <td className="px-5 py-4">
                  <strong className="block text-slate-800">{product.productName}</strong>
                  <span className="mt-1 block text-xs text-slate-400">{product.primaryBarcode ? `Barcode: ${product.primaryBarcode}` : product.baseUnit}</span>
                </td>
                <td className="px-5 py-4">
                  <strong className="text-base text-emerald-700">{formatInventoryQty(product.activeQuantity)} {product.baseUnit}</strong>
                  <span className="ml-2 text-xs font-semibold text-slate-500">Active · {batchLabel(product.activeBatchCount)}</span>
                </td>
                <td className="px-5 py-4">
                  {product.unavailableStock.length ? (
                    <div className="grid gap-1.5">
                      {product.unavailableStock.map((stock) => (
                        <span className="text-sm text-slate-700" key={stock.reason}>
                          <strong className="text-rose-700">{formatInventoryQty(stock.quantity)} {product.baseUnit}</strong>
                          <span className="ml-2 text-xs font-semibold text-slate-500">{stock.reason} · {batchLabel(stock.batchCount)}</span>
                        </span>
                      ))}
                    </div>
                  ) : <span className="text-slate-400">—</span>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="px-5 py-16 text-center text-slate-400" colSpan={3}>No stock history found.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
