"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CircleAlert, CircleCheck, ShoppingCart } from "lucide-react";
import { completeSaleAction } from "@/modules/sales/sale.actions";
import {
  getPosBatchPreviewAction,
  lookupProductByBarcodeAction,
  searchProductsForPosAction,
} from "@/modules/sales/pos.actions";
import type { PrescriptionDecisionInput } from "@/modules/prescriptions/prescription.types";
import type {
  PosCartLine,
  PosPaymentInput,
  PosProductSearchResult,
  PosUnitOption,
} from "@/modules/sales/pos.types";
import {
  calculatePosTotals,
  createCartLine,
  updateCartLineQuantity,
  updateCartLineUnit,
} from "@/modules/sales/pos.utils";
import type { SaleReceipt } from "@/modules/sales/sale.types";
import { BarcodeInput } from "./BarcodeInput";
import { CartTable } from "./CartTable";
import { ControlledDrugModal } from "./ControlledDrugModal";
import { PaymentModal } from "./PaymentModal";
import { PosSummaryPanel, type PosPaymentMode } from "./PosSummaryPanel";
import { PrescriptionPromptModal } from "./PrescriptionPromptModal";
import { ProductSearchPanel } from "./ProductSearchPanel";
import { ReceiptModal } from "./ReceiptModal";
import { UnitSelectorModal } from "./UnitSelectorModal";

type Notice = { tone: "success" | "warning" | "error"; message: string } | null;

export function PosWorkspace({ initialProducts }: { initialProducts: PosProductSearchResult[] }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [products, setProducts] = useState(initialProducts);
  const [lines, setLines] = useState<PosCartLine[]>([]);
  const [selectedLine, setSelectedLine] = useState<PosCartLine | null>(null);
  const [paymentMode, setPaymentMode] = useState<PosPaymentMode>("split");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [pendingPayments, setPendingPayments] = useState<PosPaymentInput[] | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [controlledDrugOpen, setControlledDrugOpen] = useState(false);
  const [isSearching, startSearchTransition] = useTransition();
  const [isCompletingSale, setIsCompletingSale] = useState(false);
  const saleSubmissionRef = useRef<{ requestId: string | null; inFlight: boolean }>({
    requestId: null,
    inFlight: false,
  });

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
          .then((items) => {
            if (!cancelled) setProducts(items);
          })
          .catch(() => {
            if (!cancelled) setNotice({ tone: "warning", message: "Product search is temporarily unavailable." });
          });
      });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [deferredQuery, initialProducts]);

  const refreshBatchPreview = async (line: PosCartLine) => {
    const preview = await getPosBatchPreviewAction(line.productId, line.unitId, String(line.quantity));
    setLines((current) =>
      current.map((item) =>
        item.id === line.id && item.quantity === line.quantity
          ? { ...item, batchPreview: preview ?? undefined }
          : item,
      ),
    );
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

    setLines((current) =>
      existing
        ? current.map((line) => (line.id === existing.id ? nextLine : line))
        : [...current, nextLine],
    );
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
    setLines((current) => current.map((item) => (item.id === lineId ? nextLine : item)));
    void refreshBatchPreview(nextLine);
  };

  const changeUnit = (lineId: string, unit: PosUnitOption) => {
    const line = lines.find((item) => item.id === lineId);
    if (!line) return;
    const nextLine = updateCartLineUnit(line, unit);
    setLines((current) => current.map((item) => (item.id === lineId ? nextLine : item)));
    void refreshBatchPreview(nextLine);
  };

  const clearTransactionState = () => {
    setPendingPayments(null);
    setPromptOpen(false);
    setControlledDrugOpen(false);
    setPaymentOpen(false);
  };

  const clearCart = (preserveReceipt = false) => {
    setLines([]);
    setNotice(null);
    if (!preserveReceipt) setReceipt(null);
    setSelectedLine(null);
    clearTransactionState();
  };

  const submitSale = async (payments: PosPaymentInput[], prescription?: PrescriptionDecisionInput) => {
    if (lines.length === 0 || saleSubmissionRef.current.inFlight) return;

    const requestId = saleSubmissionRef.current.requestId ?? crypto.randomUUID();
    saleSubmissionRef.current = { requestId, inFlight: true };
    setIsCompletingSale(true);
    try {
      const result = await completeSaleAction({
        clientRequestId: requestId,
        requestedStatus: "COMPLETED",
        lines: lines.map((line) => ({
          clientLineId: line.id,
          productId: line.productId,
          unitId: line.unitId,
          quantity: String(line.quantity),
          quotedUnitPrice: line.unitPrice.toFixed(2),
          barcodeUsed: line.primaryBarcode ?? undefined,
        })),
        payments: payments.map((payment) => ({
          method: payment.method,
          amount: payment.amount,
          cardReference: payment.cardReference,
        })),
        expectedTotal: totals.total.toFixed(2),
        discountAmount: totals.discount.toFixed(2),
        taxAmount: totals.tax.toFixed(2),
        prescription,
      });

      if (!result.ok) {
        saleSubmissionRef.current.requestId = null;
        setNotice({ tone: "warning", message: result.error.message });
        return;
      }

      const soldByProduct = new Map<string, number>();
      for (const allocation of result.sale.allocations) {
        soldByProduct.set(
          allocation.productId,
          (soldByProduct.get(allocation.productId) ?? 0) + Number(allocation.qtyBase),
        );
      }
      setProducts((current) => current.map((product) => {
        const soldQty = soldByProduct.get(product.id);
        if (soldQty == null) return product;
        const availableQty = Math.max(0, Number(product.availableQtyBase) - soldQty);
        return {
          ...product,
          availableQtyBase: availableQty.toFixed(3),
          hasActiveStock: availableQty > 0,
        };
      }));
      saleSubmissionRef.current.requestId = null;
      setReceipt(result.sale.receipt);
      setNotice({ tone: "success", message: `Sale ${result.sale.saleNumber} completed successfully.` });
      clearCart(true);
    } catch {
      setNotice({ tone: "error", message: "Sale completion failed unexpectedly." });
    } finally {
      saleSubmissionRef.current.inFlight = false;
      setIsCompletingSale(false);
      clearTransactionState();
    }
  };

  const handlePaymentComplete = (payments: PosPaymentInput[]) => {
    setPendingPayments(payments);
    setPaymentOpen(false);

    if (controlledProductCount > 0) {
      setControlledDrugOpen(true);
      return;
    }

    if (promptedProductCount > 0) {
      setPromptOpen(true);
      return;
    }

    void submitSale(payments);
  };

  const handlePromptDecision = (decision: PrescriptionDecisionInput) => {
    setPromptOpen(false);
    if (pendingPayments) void submitSale(pendingPayments, decision);
  };

  const handleControlledDecision = (decision: PrescriptionDecisionInput) => {
    setControlledDrugOpen(false);
    if (pendingPayments) void submitSale(pendingPayments, decision);
  };

  function openPayment(mode: PosPaymentMode) {
    setPaymentMode(mode);
    setPaymentOpen(true);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-text sm:text-4xl">
            Point of Sale
          </h1>
        </div>
        <div className="w-full max-w-xl">
          <BarcodeInput onScan={handleBarcodeScan} />
        </div>
      </div>

      {notice ? (
        <div
          className={`mt-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
            notice.tone === "success"
              ? "border-status-success-bg bg-status-success-bg text-status-success-text"
              : notice.tone === "warning"
                ? "border-status-warning-bg bg-status-warning-bg text-status-warning-text"
                : "border-status-danger-bg bg-status-danger-bg text-status-danger-text"
          }`}
        >
          {notice.tone === "success" ? (
            <CircleCheck className="size-4" />
          ) : (
            <CircleAlert className="size-4" />
          )}
          {notice.message}
        </div>
      ) : null}

      <div className="mt-4 flex items-start gap-6 relative">
        {/* Left main area */}
        <div className="flex-1 min-w-0">
          <ProductSearchPanel
            isLoading={isSearching}
            onAddProduct={(product) => {
              void addProduct(product);
            }}
            onQueryChange={setQuery}
            products={products}
            query={query}
          />
        </div>

        {/* Right sidebar cart */}
        <div className="sticky top-20 w-[320px] flex-shrink-0 xl:w-[360px] flex flex-col rounded-2xl bg-neutral-surface shadow-[0_2px_12px_rgba(15,23,42,0.03)] border border-neutral-border/60 overflow-hidden h-[calc(100vh-120px)]">
          <div className="flex-1 overflow-hidden p-4">
            <CartTable
              lines={lines}
              onQuantityChange={changeQuantity}
              onRemove={(lineId) => setLines((current) => current.filter((line) => line.id !== lineId))}
              onSelectUnit={setSelectedLine}
            />
          </div>
          <div className="border-t border-neutral-border p-5">
            <PosSummaryPanel
              {...totals}
              hasLines={lines.length > 0}
              onClear={clearCart}
              onHold={() => setNotice({ tone: "warning", message: "Held sales are not implemented yet." })}
              onPayment={openPayment}
            />
          </div>
        </div>
      </div>

      {selectedLine ? (
        <UnitSelectorModal line={selectedLine} onClose={() => setSelectedLine(null)} onSelect={changeUnit} />
      ) : null}
      {paymentOpen ? (
        <PaymentModal
          mode={paymentMode}
          onClose={() => setPaymentOpen(false)}
          onComplete={handlePaymentComplete}
          open
          total={totals.total}
        />
      ) : null}
      {promptOpen ? (
        <PrescriptionPromptModal
          isSubmitting={isCompletingSale}
          onClose={() => {
            setPromptOpen(false);
            setPendingPayments(null);
          }}
          onConfirm={handlePromptDecision}
          open
          productCount={promptedProductCount}
        />
      ) : null}
      {controlledDrugOpen ? (
        <ControlledDrugModal
          isSubmitting={isCompletingSale}
          onClose={() => {
            setControlledDrugOpen(false);
            setPendingPayments(null);
          }}
          onConfirm={handleControlledDecision}
          open
          productCount={controlledProductCount}
        />
      ) : null}
      {receipt ? <ReceiptModal onClose={() => setReceipt(null)} receipt={receipt} /> : null}
    </div>
  );
}
