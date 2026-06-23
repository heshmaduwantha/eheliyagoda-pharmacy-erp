"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { recordSupplierPaymentAction } from "@/modules/finance/finance.actions";
import type { SupplierInvoiceBalanceRow } from "@/modules/finance/supplier-payment.types";
import { idleFormState } from "@/lib/forms";
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
    return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">No outstanding supplier invoices available for payment.</div>;
  }

  const outstanding = Number(selectedInvoice?.outstandingAmount ?? "0");
  const enteredAmount = Number(amount || 0);
  const overLimit = enteredAmount > outstanding;
  const completeDisabled = overLimit || enteredAmount <= 0 || !selectedInvoiceId;

  return (
    <form action={formAction} className="grid gap-4" ref={formRef}>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Field htmlFor="supplierInvoiceId" label="Supplier invoice" error={state.status === "error" ? state.fieldErrors?.supplierInvoiceId : undefined}>
          <select
            className={inputClass}
            id="supplierInvoiceId"
            name="supplierInvoiceId"
            value={selectedInvoiceId}
            onChange={(event) => setSelectedInvoiceId(event.target.value)}
            required
          >
            {invoices.map((invoice) => (
              <option key={invoice.supplierInvoiceId} value={invoice.supplierInvoiceId}>
                {invoice.invoiceNumber ?? invoice.supplierInvoiceId} · {invoice.supplierName} · Balance {invoice.outstandingAmount}
              </option>
            ))}
          </select>
        </Field>
        <Field htmlFor="paidAt" label="Payment date" error={state.status === "error" ? state.fieldErrors?.paidAt : undefined}>
          <input className={inputClass} id="paidAt" name="paidAt" onChange={(event) => setPaidAt(event.target.value)} value={paidAt} type="date" required />
        </Field>
      </div>

      <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 text-sm text-teal-900">
        <p className="font-bold">{selectedInvoice?.supplierName}</p>
        <p className="mt-1 text-teal-800">
          Invoice {selectedInvoice?.invoiceNumber ?? "—"} · Total {selectedInvoice?.totalAmount} · Paid {selectedInvoice?.paidAmount} · Outstanding {selectedInvoice?.outstandingAmount}
        </p>
        {selectedInvoice?.dueDate ? <p className="mt-1 text-xs text-teal-700">Due date: {selectedInvoice.dueDate}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field htmlFor="amount" label="Amount" error={state.status === "error" ? state.fieldErrors?.amount : undefined}>
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
        <Field htmlFor="paymentMethod" label="Payment method" error={state.status === "error" ? state.fieldErrors?.paymentMethod : undefined}>
          <select className={inputClass} defaultValue="CASH" id="paymentMethod" name="paymentMethod" required>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method === "CASH" ? "Cash" : "Card"}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field htmlFor="reference" label="Reference">
          <input className={inputClass} id="reference" name="reference" placeholder="Bank transfer / receipt no." />
        </Field>
        <Field htmlFor="notes" label="Notes">
          <input className={inputClass} id="notes" name="notes" placeholder="Optional notes" />
        </Field>
      </div>

      {overLimit ? <p className="text-sm font-semibold text-red-600">Payment amount cannot exceed the outstanding invoice balance.</p> : null}
      <FormAlert state={state} />
      <div>
        <SubmitButton disabled={completeDisabled}>Record payment</SubmitButton>
      </div>
    </form>
  );
}
