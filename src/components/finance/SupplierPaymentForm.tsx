"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { recordSupplierPaymentAction } from "@/modules/finance/finance.actions";
import type { SupplierInvoiceBalanceRow } from "@/modules/finance/supplier-payment.types";
import { idleFormState } from "@/lib/forms";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Field, FormAlert, SubmitButton, inputClass } from "@/components/ui/form";

const PAYMENT_METHODS = ["CASH", "CARD"] as const;

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export function SupplierPaymentForm({ invoices }: { invoices: SupplierInvoiceBalanceRow[] }) {
  const [state, formAction] = useActionState(recordSupplierPaymentAction, idleFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoices[0]?.supplierInvoiceId ?? "");
  const [amount, setAmount] = useState(invoices[0]?.outstandingAmount ?? "");
  const [paidAt, setPaidAt] = useState(todayValue());

  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.supplierInvoiceId === selectedInvoiceId) ?? invoices[0] ?? null,
    [invoices, selectedInvoiceId],
  );

  useEffect(() => {
    if (!selectedInvoice && invoices.length === 0) return;
    const nextSelected = selectedInvoice ?? invoices[0];
    if (!nextSelected) return;
    setSelectedInvoiceId(nextSelected.supplierInvoiceId);
    setAmount((current) => {
      const currentValue = Number(current || 0);
      const maxValue = Number(nextSelected.outstandingAmount || 0);
      return !current || currentValue > maxValue ? nextSelected.outstandingAmount : current;
    });
  }, [invoices, selectedInvoice]);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      const first = invoices[0];
      setSelectedInvoiceId(first?.supplierInvoiceId ?? "");
      setAmount(first?.outstandingAmount ?? "");
      setPaidAt(todayValue());
    }
  }, [invoices, state]);

  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-border bg-neutral-bg p-6 text-sm text-neutral-muted">
        No outstanding invoices — you&apos;re all paid up!
      </div>
    );
  }

  const outstanding = Number(selectedInvoice?.outstandingAmount ?? "0");
  const enteredAmount = Number(amount || 0);
  const overLimit = enteredAmount > outstanding;
  const completeDisabled = overLimit || enteredAmount <= 0 || !selectedInvoiceId;

  return (
    <form action={formAction} className="grid gap-4" ref={formRef}>
      {/* Pick invoice */}
      <Field htmlFor="supplierInvoiceId" label="Pick an invoice" error={state.status === "error" ? state.fieldErrors?.supplierInvoiceId : undefined}>
        <SearchableSelect
          id="supplierInvoiceId"
          name="supplierInvoiceId"
          defaultValue={selectedInvoiceId}
          onChange={setSelectedInvoiceId}
          required
          placeholder="Select invoice..."
          options={invoices.map((invoice) => ({
            value: invoice.supplierInvoiceId,
            label: `${invoice.supplierName} — ${invoice.invoiceNumber ?? "Invoice"} — You owe ${invoice.outstandingAmount}`,
          }))}
        />
      </Field>

      {/* Invoice summary */}
      {selectedInvoice && (
        <div className="rounded-xl border border-brand-default/20 bg-brand-pale/60 px-4 py-3 text-sm text-brand-default">
          <p className="font-bold">{selectedInvoice.supplierName}</p>
          <p className="mt-1 text-brand-default">
            Invoice {selectedInvoice.invoiceNumber ?? "—"} · Total paid so far: {selectedInvoice.paidAmount} ·{" "}
            <strong>Still owe: {selectedInvoice.outstandingAmount}</strong>
          </p>
          {selectedInvoice.dueDate && (
            <p className="mt-1 text-xs text-brand-default">Due date: {selectedInvoice.dueDate}</p>
          )}
        </div>
      )}

      {/* Payment amount & method */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field htmlFor="amount" label="Amount to pay (LKR)" error={state.status === "error" ? state.fieldErrors?.amount : undefined}>
          <input
            className={inputClass}
            id="amount"
            max={selectedInvoice?.outstandingAmount}
            min="0.01"
            name="amount"
            onChange={(event) => setAmount(event.target.value)}
            step="0.01"
            type="number"
            value={amount}
            required
          />
        </Field>
        <Field htmlFor="paymentMethod" label="Paid by" error={state.status === "error" ? state.fieldErrors?.paymentMethod : undefined}>
          <select className={inputClass} defaultValue="CASH" id="paymentMethod" name="paymentMethod" required>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method === "CASH" ? "Cash" : "Card"}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* More options */}
      <details className="rounded-xl border border-neutral-border bg-neutral-bg">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold text-neutral-muted marker:content-none">
          <ChevronDown className="size-4 text-neutral-muted" />
          More options
          <span className="ml-1 text-xs font-normal text-neutral-muted">(payment date, reference, notes)</span>
        </summary>
        <div className="grid gap-4 border-t border-neutral-border px-4 pb-4 pt-4 sm:grid-cols-2">
          <Field htmlFor="paidAt" label="Payment date" error={state.status === "error" ? state.fieldErrors?.paidAt : undefined}>
            <input className={inputClass} id="paidAt" name="paidAt" onChange={(event) => setPaidAt(event.target.value)} value={paidAt} type="date" required />
          </Field>
          <Field htmlFor="reference" label="Reference (bank transfer / receipt no.)">
            <input className={inputClass} id="reference" name="reference" placeholder="Optional" />
          </Field>
          <Field htmlFor="notes" label="Notes">
            <input className={inputClass} id="notes" name="notes" placeholder="Optional" />
          </Field>
        </div>
      </details>

      {overLimit && (
        <p className="text-sm font-semibold text-status-danger-text">
          The amount you entered is more than what you owe on this invoice.
        </p>
      )}
      <FormAlert state={state} />

      {state.status === "success" && state.paymentId && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
          <span>Supplier Payment recorded successfully!</span>
        </div>
      )}

      <div>
        <SubmitButton disabled={completeDisabled}>Record payment</SubmitButton>
      </div>
    </form>
  );
}
