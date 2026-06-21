"use client";

import { useMemo, useState } from "react";
import { CircleAlert, CircleCheck, ShoppingCart } from "lucide-react";
import type { PosCartLine, PosPaymentInput, PosProductSearchResult, PosReceiptPreview, PosUnitOption } from "@/modules/sales/pos.types";
import { findMockProductByBarcode, searchPosProducts } from "@/modules/sales/pos.service";
import { calculatePosTotals, createCartLine, createReceiptPreview, updateCartLineQuantity, updateCartLineUnit } from "@/modules/sales/pos.utils";
import { BarcodeInput } from "./BarcodeInput";
import { CartTable } from "./CartTable";
import { PaymentModal } from "./PaymentModal";
import { PosSummaryPanel, type PosPaymentMode } from "./PosSummaryPanel";
import { ProductSearchPanel } from "./ProductSearchPanel";
import { ReceiptModal } from "./ReceiptModal";
import { UnitSelectorModal } from "./UnitSelectorModal";

type Notice = { tone: "success" | "warning"; message: string } | null;

export function PosWorkspace() {
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<PosCartLine[]>([]);
  const [selectedLine, setSelectedLine] = useState<PosCartLine | null>(null);
  const [paymentMode, setPaymentMode] = useState<PosPaymentMode>("split");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receipt, setReceipt] = useState<PosReceiptPreview | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const products = useMemo(() => searchPosProducts(query), [query]);
  const totals = useMemo(() => calculatePosTotals(lines), [lines]);

  const addProduct = (product: PosProductSearchResult) => {
    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (!existing) return [...current, createCartLine(product)];
      return current.map((line) => line.id === existing.id ? updateCartLineQuantity(line, line.quantity + 1) : line);
    });
    setNotice({ tone: "success", message: `${product.name} added to the mock cart.` });
  };

  const handleBarcodeScan = (barcode: string) => {
    // TODO(catalog): Replace mock lookup with the barcode search service.
    const product = findMockProductByBarcode(barcode);
    if (!product) {
      setNotice({ tone: "warning", message: `No mock product found for barcode ${barcode}.` });
      return;
    }
    addProduct(product);
  };

  const changeQuantity = (lineId: string, quantity: number) => {
    setLines((current) => current.map((line) => line.id === lineId ? updateCartLineQuantity(line, quantity) : line));
  };

  const changeUnit = (lineId: string, unit: PosUnitOption) => {
    setLines((current) => current.map((line) => line.id === lineId ? updateCartLineUnit(line, unit) : line));
  };

  const openPayment = (mode: PosPaymentMode) => {
    setPaymentMode(mode);
    setPaymentOpen(true);
  };

  const handlePaymentComplete = (payment: PosPaymentInput) => {
    // TODO(sales): Send a validated command to the Sale service when the backend exists.
    // No stock, FEFO allocation, sale, or payment persistence happens in this UI shell.
    setReceipt(createReceiptPreview(lines, payment));
    setPaymentOpen(false);
  };

  return <div><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="flex items-center gap-2 text-sm font-bold text-teal-700"><ShoppingCart className="size-4" />Sales workspace</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Point of Sale</h1><p className="mt-2 text-slate-500">Mock UI shell — no sale, payment, or stock mutation is performed.</p></div><div className="w-full max-w-xl"><BarcodeInput onScan={handleBarcodeScan} /></div></div>{notice && <div className={`mt-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${notice.tone === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-amber-100 bg-amber-50 text-amber-700"}`}>{notice.tone === "success" ? <CircleCheck className="size-4" /> : <CircleAlert className="size-4" />}{notice.message}</div>}<div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(320px,.78fr)_minmax(560px,1.22fr)]"><ProductSearchPanel onAddProduct={addProduct} onQueryChange={setQuery} products={products} query={query} /><div className="grid gap-5"><CartTable lines={lines} onQuantityChange={changeQuantity} onRemove={(lineId) => setLines((current) => current.filter((line) => line.id !== lineId))} onSelectUnit={setSelectedLine} /><PosSummaryPanel {...totals} hasLines={lines.length > 0} onClear={() => { setLines([]); setNotice(null); }} onHold={() => setNotice({ tone: "warning", message: "Hold is a local UI placeholder; nothing was persisted." })} onPayment={openPayment} /></div></div><UnitSelectorModal line={selectedLine} onClose={() => setSelectedLine(null)} onSelect={changeUnit} /><PaymentModal mode={paymentMode} onClose={() => setPaymentOpen(false)} onComplete={handlePaymentComplete} open={paymentOpen} total={totals.total} /><ReceiptModal onClose={() => setReceipt(null)} receipt={receipt} /></div>;
}
