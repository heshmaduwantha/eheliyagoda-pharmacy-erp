"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CircleAlert, CircleCheck, Search } from "lucide-react";
import { completeSaleAction } from "@/modules/sales/sale.actions";
import { lookupProductByBarcodeAction } from "@/modules/sales/pos.actions";
import type { PrescriptionDecisionInput } from "@/modules/prescriptions/prescription.types";
import type {
  PosCartLine,
  PosPaymentInput,
  PosProductSearchResult,
  PosUnitOption,
} from "@/modules/sales/pos.types";
import {
  calculatePosTotals,
  applyCartLineBatchPreview,
  canCartLineFulfilSelectedBatch,
  createCartLine,
  updateCartLineQuantity,
  updateCartLineUnit,
  updateCartLineBatch,
} from "@/modules/sales/pos.utils";
import { generateClientUuid } from "@/lib/uuid";
import type { SaleReceipt } from "@/modules/sales/sale.types";

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
  const [lastAddedLineId, setLastAddedLineId] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<PosCartLine | null>(null);
  const [paymentMode, setPaymentMode] = useState<PosPaymentMode>("split");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [pendingPayments, setPendingPayments] = useState<PosPaymentInput[] | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [controlledDrugOpen, setControlledDrugOpen] = useState(false);
  const [discountType, setDiscountType] = useState<"AMOUNT" | "PERCENT">("AMOUNT");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [isSearching, startSearchTransition] = useTransition();
  const [isCompletingSale, setIsCompletingSale] = useState(false);
  const searchCacheRef = useRef(new Map<string, PosProductSearchResult[]>());
  const saleSubmissionRef = useRef<{ requestId: string | null; inFlight: boolean }>({
    requestId: null,
    inFlight: false,
  });

  const calculatedDiscount = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    if (discountType === "PERCENT") {
      return Math.min(subtotal, Math.round(((subtotal * Math.max(0, discountValue)) / 100) * 100) / 100);
    }
    return Math.min(subtotal, Math.max(0, discountValue));
  }, [lines, discountType, discountValue]);

  const totals = useMemo(() => calculatePosTotals(lines, calculatedDiscount), [lines, calculatedDiscount]);
  const canCheckout = useMemo(
    () => lines.length > 0 && lines.every((line) => line.quantity > 0),
    [lines],
  );
  const promptedProductCount = lines.filter((line) => line.prescriptionRule === "PROMPT_SKIPPABLE").length;
  const controlledProductCount = lines.filter((line) => line.prescriptionRule === "HARD_REQUIRED_CONTROLLED").length;

  // Auto-dismiss notice toasts after 3.5 seconds
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const normalizedQuery = deferredQuery.trim();
    if (normalizedQuery === "") {
      setProducts(initialProducts);
      return;
    }

    const cached = searchCacheRef.current.get(normalizedQuery.toLowerCase());
    if (cached) {
      setProducts(cached);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/pos/search?q=${encodeURIComponent(normalizedQuery)}`, {
            signal: controller.signal,
            cache: "no-store",
          });
          if (!response.ok) throw new Error("Product search failed");
          const items: PosProductSearchResult[] = await response.json();
          searchCacheRef.current.set(normalizedQuery.toLowerCase(), items);
          if (!cancelled) {
            startSearchTransition(() => setProducts(items));
          }
        } catch {
          if (!cancelled) setNotice({ tone: "warning", message: "Product search is temporarily unavailable." });
        }
      })();
    }, 350);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [deferredQuery, initialProducts]);

  const receiveBatchPreview = useCallback((lineId: string, quantity: number, preview: PosCartLine["batchPreview"]) => {
    setLines((current) => current.map((line) =>
      line.id === lineId && line.quantity === quantity
        ? applyCartLineBatchPreview(line, preview)
        : line,
    ));
  }, []);

  const addProduct = async (product: PosProductSearchResult, selectedUnit?: PosUnitOption | null) => {
    if (product.units.length === 0) {
      setNotice({ tone: "warning", message: `${product.name} has no sale unit configured.` });
      return;
    }

    let targetUnit = selectedUnit;
    if (!targetUnit) {
      targetUnit = product.units.find((item) => item.id === product.defaultSaleUnitId) ?? product.units[0];
    }
    const targetUnitId = targetUnit?.id;
    setLastAddedLineId(`${product.id}-${targetUnitId}`);

    setLines((current) => {
      const existingIndex = current.findIndex(
        (line) => line.productId === product.id && line.unitId === targetUnitId,
      );
      if (existingIndex >= 0) {
        const existing = current[existingIndex];
        const nextLine = updateCartLineQuantity(existing, existing.quantity + 1);
        const nextLines = [...current];
        nextLines[existingIndex] = nextLine;
        return nextLines;
      } else {
        let newLine = createCartLine(product);
        if (targetUnit && targetUnit.id !== newLine.unitId) {
          newLine = updateCartLineUnit(newLine, targetUnit);
        }
        return [...current, newLine];
      }
    });

    setNotice({ tone: "success", message: `${product.name} added to the cart.` });
  };

  const changeQuantity = (lineId: string, quantity: number) => {
    if (quantity <= 0) {
      setNotice({ tone: "warning", message: "Quantity must be greater than zero." });
      return;
    }

    setLines((current) => {
      const line = current.find((item) => item.id === lineId);
      if (!line) return current;
      const nextLine = updateCartLineQuantity(line, quantity);
      return current.map((item) => (item.id === lineId ? nextLine : item));
    });
  };

  const changeUnit = (lineId: string, unit: PosUnitOption) => {
    const line = lines.find((item) => item.id === lineId);
    if (!line) return;
    const nextLine = updateCartLineUnit(line, unit);
    setLastAddedLineId((current) => current === lineId ? nextLine.id : current);
    setLines((current) => current.map((item) => (item.id === lineId ? nextLine : item)));
  };

  const changeBatch = (lineId: string, batchId: string) => {
    const line = lines.find((item) => item.id === lineId);
    if (!line) return;
    const nextLine = updateCartLineBatch(line, batchId);
    setLines((current) => current.map((item) => (item.id === lineId ? nextLine : item)));
  };

  const clearTransactionState = () => {
    setPendingPayments(null);
    setPromptOpen(false);
    setControlledDrugOpen(false);
    setPaymentOpen(false);
  };

  const clearCart = (preserveReceipt = false) => {
    setLines([]);
    setDiscountValue(0);
    setDiscountType("AMOUNT");
    if (!preserveReceipt) {
      setNotice(null);
      setReceipt(null);
    }
    setSelectedLine(null);
    clearTransactionState();
  };

  const submitSale = async (payments: PosPaymentInput[], prescription?: PrescriptionDecisionInput) => {
    if (!canCheckout || saleSubmissionRef.current.inFlight) {
      setNotice({ tone: "warning", message: "Resolve the cart quantity or stock warning before taking payment." });
      return;
    }

    const requestId = saleSubmissionRef.current.requestId ?? generateClientUuid();
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
          batchId: line.selectedBatchId,
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
      clearCart(true);
      setReceipt(result.sale.receipt);
      setNotice({ tone: "success", message: `Sale ${result.sale.saleNumber} completed successfully.` });
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between shrink-0 mb-1">
        <h1 className="text-2xl font-black tracking-tight text-neutral-text sm:text-3xl">
          Point of Sale
        </h1>
      </div>

      {notice ? (
        <div
          className={`mt-2 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
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

      <div className="mt-2 grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_540px] 2xl:grid-cols-[minmax(0,1fr)_600px] pb-6">
        {/* Left main area with Search Input */}
        <div className="min-w-0 flex flex-col gap-4">
          <label className="flex items-center gap-3 rounded-2xl bg-neutral-surface px-4 py-3 shadow-xs border border-neutral-border focus-within:border-brand-default focus-within:ring-4 focus-within:ring-brand-default/10 transition-all">
            <Search className="size-5 shrink-0 text-neutral-muted" />
            <input
              className="min-w-0 flex-1 bg-transparent py-1 text-base font-medium outline-none text-neutral-text placeholder:font-normal placeholder:text-neutral-muted"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={async (e) => {
                if ((e.key === "ArrowUp" || e.key === "ArrowDown") && !query.trim()
                  && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey
                  && !e.nativeEvent.isComposing && !paymentOpen && !promptOpen
                  && !controlledDrugOpen && !selectedLine && !isCompletingSale && !receipt) {
                  if (!lines.some((line) => line.id === lastAddedLineId)) return;
                  e.preventDefault();
                  const delta = e.key === "ArrowUp" ? 1 : -1;
                  setLines((current) => current.map((line) => line.id === lastAddedLineId
                    ? updateCartLineQuantity(line, Math.max(1, line.quantity + delta))
                    : line));
                  return;
                }
                if (e.key === "Enter" && query.trim()) {
                  e.preventDefault();
                  const trimmed = query.trim();
                  try {
                    // Resolve scans against the barcode table before using name results.
                    // Search results may still belong to the previous debounced query.
                    const barcodeResult = await lookupProductByBarcodeAction(trimmed);
                    if (barcodeResult) {
                      await addProduct(barcodeResult.product, barcodeResult.matchedUnit);
                      setQuery("");
                    } else {
                      const nameMatch = products.find((product) => product.name.toLowerCase() === trimmed.toLowerCase());
                      if (nameMatch) {
                        await addProduct(nameMatch);
                        setQuery("");
                      } else {
                        setNotice({ tone: "warning", message: "No matching barcode. Select a medicine from the search results." });
                      }
                    }
                  } catch {
                    setNotice({ tone: "error", message: "Barcode lookup failed. Please try again." });
                  }
                }
              }}
              aria-label="Search medicines or scan barcode"
              placeholder="Search medicine or scan barcode…"
              value={query}
            />
          </label>

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
        <div className="w-full min-w-0 flex flex-col rounded-2xl bg-neutral-surface shadow-sm border border-neutral-border overflow-hidden xl:sticky xl:top-4 xl:max-h-[calc(100vh-140px)]">
          <div className="flex-1 min-h-[220px] max-h-[48vh] xl:max-h-none overflow-y-auto p-4 sm:p-5">
            <CartTable
              lines={lines}
              onQuantityChange={changeQuantity}
              onRemove={(lineId) => setLines((current) => current.filter((line) => line.id !== lineId))}
              onSelectUnit={setSelectedLine}
              onChangeBatch={changeBatch}
              onBatchPreview={receiveBatchPreview}
            />
          </div>
          <div className="shrink-0 border-t border-neutral-border bg-neutral-bg/40 p-5">
            <PosSummaryPanel
              {...totals}
              discountType={discountType}
              discountValue={discountValue}
              onDiscountChange={(type, val) => {
                setDiscountType(type);
                setDiscountValue(val);
              }}
              hasLines={lines.length > 0}
              canCheckout={canCheckout}
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
