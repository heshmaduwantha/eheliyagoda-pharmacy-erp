"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CircleAlert, CircleCheck, Search } from "lucide-react";
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

  // Auto-dismiss notice toasts after 3.5 seconds
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

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

    let targetUnit = selectedUnit;
    if (!targetUnit) {
      targetUnit = product.units.find((item) => item.id === product.defaultSaleUnitId) ?? product.units[0];
    }
    const targetUnitId = targetUnit?.id;

    let updatedLine: PosCartLine | null = null;

    setLines((current) => {
      const existingIndex = current.findIndex(
        (line) => line.productId === product.id && line.unitId === targetUnitId,
      );
      if (existingIndex >= 0) {
        const existing = current[existingIndex];
        const nextLine = updateCartLineQuantity(existing, existing.quantity + 1);
        updatedLine = nextLine;
        const nextLines = [...current];
        nextLines[existingIndex] = nextLine;
        return nextLines;
      } else {
        let newLine = createCartLine(product);
        if (targetUnit && targetUnit.id !== newLine.unitId) {
          newLine = updateCartLineUnit(newLine, targetUnit);
        }
        updatedLine = newLine;
        return [...current, newLine];
      }
    });

    setNotice({ tone: "success", message: `${product.name} added to the cart.` });
    if (updatedLine) {
      await refreshBatchPreview(updatedLine);
    }
  };

  const changeQuantity = (lineId: string, quantity: number) => {
    if (quantity <= 0) {
      setLines((current) => current.filter((item) => item.id !== lineId));
      return;
    }

    let updatedLine: PosCartLine | null = null;
    setLines((current) => {
      const line = current.find((item) => item.id === lineId);
      if (!line) return current;
      const nextLine = updateCartLineQuantity(line, quantity);
      updatedLine = nextLine;
      return current.map((item) => (item.id === lineId ? nextLine : item));
    });

    if (updatedLine) {
      void refreshBatchPreview(updatedLine);
    }
  };

  const changeUnit = (lineId: string, unit: PosUnitOption) => {
    const line = lines.find((item) => item.id === lineId);
    if (!line) return;
    const nextLine = updateCartLineUnit(line, unit);
    setLines((current) => current.map((item) => (item.id === lineId ? nextLine : item)));
    void refreshBatchPreview(nextLine);
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
    if (!preserveReceipt) {
      setNotice(null);
      setReceipt(null);
    }
    setSelectedLine(null);
    clearTransactionState();
  };

  const submitSale = async (payments: PosPaymentInput[], prescription?: PrescriptionDecisionInput) => {
    if (lines.length === 0 || saleSubmissionRef.current.inFlight) return;

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
    <div className="flex flex-col h-[calc(100vh-170px)] overflow-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0 mb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-text">
            Point of Sale
          </h1>
        </div>
        <div className="w-full sm:w-auto sm:min-w-[320px] max-w-md">
          <label className="flex items-center gap-2 rounded-xl bg-neutral-surface px-3 py-1 shadow-xs border border-neutral-border focus-within:border-neutral-400 focus-within:bg-white transition-all">
            <Search className="size-4 shrink-0 text-neutral-muted" />
            <input
              className="min-w-0 flex-1 bg-transparent py-1.5 text-xs sm:text-sm outline-none text-neutral-text placeholder:text-neutral-muted"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && query.trim()) {
                  e.preventDefault();
                  const trimmed = query.trim();
                  const exactMatch =
                    products.find(
                      (p) => p.primaryBarcode?.toLowerCase() === trimmed.toLowerCase(),
                    ) ?? products[0];

                  if (exactMatch && exactMatch.hasActiveStock) {
                    await addProduct(exactMatch);
                    setQuery("");
                  } else {
                    try {
                      const barcodeResult = await lookupProductByBarcodeAction(trimmed);
                      if (barcodeResult && barcodeResult.product) {
                        await addProduct(barcodeResult.product, barcodeResult.matchedUnit);
                        setQuery("");
                      }
                    } catch {
                      // ignore error
                    }
                  }
                }
              }}
              placeholder="Scan barcode, or search by name..."
              value={query}
            />
          </label>
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

      <div className="mt-4 flex flex-1 items-stretch gap-6 relative overflow-hidden pb-4">
        {/* Left main area */}
        <div className="flex-1 min-w-0 overflow-y-auto pr-2">
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
        <div className="w-[340px] flex-shrink-0 xl:w-[400px] flex flex-col rounded-2xl bg-neutral-surface shadow-[0_2px_12px_rgba(15,23,42,0.03)] border border-neutral-border/60 overflow-hidden">
          <div className="flex-1 overflow-hidden p-4">
            <CartTable
              lines={lines}
              onQuantityChange={changeQuantity}
              onRemove={(lineId) => setLines((current) => current.filter((line) => line.id !== lineId))}
              onSelectUnit={setSelectedLine}
              onChangeBatch={changeBatch}
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
