"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { CircleAlert, CircleCheck, ShoppingCart } from "lucide-react";
import {
  getPosBatchPreviewAction,
  lookupProductByBarcodeAction,
  searchProductsForPosAction,
  validatePrescriptionForPreviewAction,
} from "@/modules/sales/pos.actions";
import type { PrescriptionDecisionInput } from "@/modules/prescriptions/prescription.types";
import type { PosCartLine, PosPaymentInput, PosProductSearchResult, PosReceiptPreview, PosUnitOption } from "@/modules/sales/pos.types";
import { calculatePosTotals, createCartLine, createReceiptPreview, updateCartLineQuantity, updateCartLineUnit } from "@/modules/sales/pos.utils";
import { BarcodeInput } from "./BarcodeInput";
import { CartTable } from "./CartTable";
import { ControlledDrugModal } from "./ControlledDrugModal";
import { PaymentModal } from "./PaymentModal";
import { PosSummaryPanel, type PosPaymentMode } from "./PosSummaryPanel";
import { PrescriptionPromptModal } from "./PrescriptionPromptModal";
import { ProductSearchPanel } from "./ProductSearchPanel";
import { ReceiptModal } from "./ReceiptModal";
import { UnitSelectorModal } from "./UnitSelectorModal";

type Notice = { tone: "success" | "warning"; message: string } | null;

export function PosWorkspace({ initialProducts }: { initialProducts: PosProductSearchResult[] }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [products, setProducts] = useState(initialProducts);
  const [lines, setLines] = useState<PosCartLine[]>([]);
  const [selectedLine, setSelectedLine] = useState<PosCartLine | null>(null);
  const [paymentMode, setPaymentMode] = useState<PosPaymentMode>("split");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receipt, setReceipt] = useState<PosReceiptPreview | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [pendingPayments, setPendingPayments] = useState<PosPaymentInput[] | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [controlledDrugOpen, setControlledDrugOpen] = useState(false);
  const [isSearching, startSearchTransition] = useTransition();
  const [isValidatingPrescription, startPrescriptionTransition] = useTransition();

  const totals = useMemo(() => calculatePosTotals(lines), [lines]);
  const promptedProductCount = lines.filter((line) => line.prescriptionRule === "PROMPT_SKIPPABLE").length;
  const controlledProductCount = lines.filter((line) => line.prescriptionRule === "HARD_REQUIRED_CONTROLLED").length;

  useEffect(() => {
    if (deferredQuery === "") {
      setProducts(initialProducts);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      startSearchTransition(() => {
        void searchProductsForPosAction(deferredQuery)
          .then((items) => { if (!cancelled) setProducts(items); })
          .catch(() => { if (!cancelled) setNotice({ tone: "warning", message: "Product search is temporarily unavailable." }); });
      });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [deferredQuery, initialProducts]);

  const refreshBatchPreview = async (line: PosCartLine) => {
    const preview = await getPosBatchPreviewAction(line.productId, line.unitId, String(line.quantity));
    setLines((current) => current.map((item) => item.id === line.id && item.quantity === line.quantity
      ? { ...item, batchPreview: preview ?? undefined }
      : item));
  };

  const addProduct = async (product: PosProductSearchResult, selectedUnit?: PosUnitOption | null) => {
    if (product.units.length === 0) {
      setNotice({ tone: "warning", message: `${product.name} has no sale unit configured.` });
      return;
    }
    let newLine = createCartLine(product);
    if (selectedUnit && selectedUnit.id !== newLine.unitId) newLine = updateCartLineUnit(newLine, selectedUnit);
    const existing = lines.find((line) => line.productId === product.id && line.unitId === newLine.unitId);
    const nextLine = existing ? updateCartLineQuantity(existing, existing.quantity + 1) : newLine;
    setLines((current) => existing
      ? current.map((line) => line.id === existing.id ? nextLine : line)
      : [...current, nextLine]);
    setNotice({ tone: "success", message: `${product.name} added to the cart.` });
    await refreshBatchPreview(nextLine);
  };

  const handleBarcodeScan = async (barcode: string) => {
    try {
      const result = await lookupProductByBarcodeAction(barcode);
      if (!result) {
        setNotice({ tone: "warning", message: `No active product found for barcode ${barcode}.` });
        return;
      }
      await addProduct(result.product, result.matchedUnit);
    } catch {
      setNotice({ tone: "warning", message: "Barcode lookup is temporarily unavailable." });
    }
  };

  const changeQuantity = (lineId: string, quantity: number) => {
    const line = lines.find((item) => item.id === lineId);
    if (!line) return;
    const nextLine = updateCartLineQuantity(line, quantity);
    setLines((current) => current.map((item) => item.id === lineId ? nextLine : item));
    void refreshBatchPreview(nextLine);
  };

  const changeUnit = (lineId: string, unit: PosUnitOption) => {
    const line = lines.find((item) => item.id === lineId);
    if (!line) return;
    const nextLine = updateCartLineUnit(line, unit);
    setLines((current) => current.map((item) => item.id === lineId ? nextLine : item));
    void refreshBatchPreview(nextLine);
  };

  const openPayment = (mode: PosPaymentMode) => {
    setPaymentMode(mode);
    setPaymentOpen(true);
  };

  const finishPreviewCheckout = (payments: PosPaymentInput[], prescription?: PrescriptionDecisionInput) => {
    startPrescriptionTransition(() => {
      void validatePrescriptionForPreviewAction({
        lines: lines.map((line) => ({ productId: line.productId })),
        prescription,
      }).then((result) => {
        if (!result.ok) {
          setNotice({ tone: "warning", message: result.error.message });
          return;
        }
        // UI preview only. Future sale completion must validate again inside its
        // PostgreSQL transaction before stock allocation, payment, or receipt persistence.
        setReceipt(createReceiptPreview(lines, payments));
        setPendingPayments(null);
        setNotice({ tone: "success", message: "Prescription requirements validated for this preview." });
      }).catch(() => setNotice({ tone: "warning", message: "Prescription validation is temporarily unavailable." }));
    });
  };

  const handlePaymentComplete = (payments: PosPaymentInput[]) => {
    setPaymentOpen(false);
    setPendingPayments(payments);
    if (controlledProductCount > 0) {
      setControlledDrugOpen(true);
      return;
    }
    if (promptedProductCount > 0) {
      setPromptOpen(true);
      return;
    }
    finishPreviewCheckout(payments);
  };

  const clearPendingPrescription = () => {
    setPromptOpen(false);
    setControlledDrugOpen(false);
    setPendingPayments(null);
  };

  const clearCart = () => {
    setLines([]);
    setNotice(null);
    clearPendingPrescription();
  };

  return <div><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="flex items-center gap-2 text-sm font-bold text-teal-700"><ShoppingCart className="size-4" />Sales workspace</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Point of Sale</h1><p className="mt-2 text-slate-500">Live catalogue and advisory batch reads. No sale, payment, reservation, or stock mutation is performed.</p></div><div className="w-full max-w-xl"><BarcodeInput onScan={handleBarcodeScan} /></div></div>{notice ? <div className={`mt-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${notice.tone === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-amber-100 bg-amber-50 text-amber-700"}`}>{notice.tone === "success" ? <CircleCheck className="size-4" /> : <CircleAlert className="size-4" />}{notice.message}</div> : null}<div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(320px,.78fr)_minmax(560px,1.22fr)]"><ProductSearchPanel isLoading={isSearching} onAddProduct={(product) => { void addProduct(product); }} onQueryChange={setQuery} products={products} query={query} /><div className="grid gap-5"><CartTable lines={lines} onQuantityChange={changeQuantity} onRemove={(lineId) => setLines((current) => current.filter((line) => line.id !== lineId))} onSelectUnit={setSelectedLine} /><PosSummaryPanel {...totals} hasLines={lines.length > 0} onClear={clearCart} onHold={() => setNotice({ tone: "warning", message: "Hold is a local UI placeholder; nothing was persisted." })} onPayment={openPayment} /></div></div><UnitSelectorModal line={selectedLine} onClose={() => setSelectedLine(null)} onSelect={changeUnit} /><PaymentModal mode={paymentMode} onClose={() => setPaymentOpen(false)} onComplete={handlePaymentComplete} open={paymentOpen} total={totals.total} /><PrescriptionPromptModal isSubmitting={isValidatingPrescription} onClose={clearPendingPrescription} onConfirm={(decision) => { setPromptOpen(false); if (pendingPayments) finishPreviewCheckout(pendingPayments, decision); }} open={promptOpen} productCount={promptedProductCount} /><ControlledDrugModal isSubmitting={isValidatingPrescription} onClose={clearPendingPrescription} onConfirm={(decision) => { setControlledDrugOpen(false); if (pendingPayments) finishPreviewCheckout(pendingPayments, decision); }} open={controlledDrugOpen} productCount={controlledProductCount} /><ReceiptModal onClose={() => setReceipt(null)} receipt={receipt} /></div>;
}
