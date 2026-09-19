"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Ban, CircleAlert, X } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { voidSaleAction } from "@/modules/sales/sale-void.actions";

type Props = {
  saleId: string;
  saleNumber: string;
  total: string;
  needsAdminApproval: boolean;
};

export function SaleVoidButton({ saleId, saleNumber, total, needsAdminApproval }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [refundMethod, setRefundMethod] = useState<"" | "CASH" | "CARD">("");
  const [refundReference, setRefundReference] = useState("");
  const [stockPolicy, setStockPolicy] = useState<"NO_STOCK_RETURN" | "RETURN_TO_ACTIVE">("NO_STOCK_RETURN");
  const [step, setStep] = useState<"details" | "approval">("details");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onApprovalStep = needsAdminApproval && step === "approval";
  const canSubmit =
    reason.trim().length > 0 && !isPending && (!onApprovalStep || (adminUsername.trim().length > 0 && adminPassword.length > 0));

  const reset = () => {
    setReason("");
    setRefundMethod("");
    setRefundReference("");
    setStockPolicy("NO_STOCK_RETURN");
    setStep("details");
    setAdminUsername("");
    setAdminPassword("");
  };

  const close = () => {
    setOpen(false);
    setStep("details");
    setAdminUsername("");
    setAdminPassword("");
  };

  const submit = () => {
    if (!canSubmit) return;
    if (needsAdminApproval && step === "details") {
      setNotice(null);
      setStep("approval");
      return;
    }
    setNotice(null);
    startTransition(() => {
      void voidSaleAction({
        saleId,
        reason: reason.trim(),
        refundAmount: total,
        refundMethod: refundMethod || undefined,
        refundReference: refundReference.trim() || undefined,
        stockPolicy,
        adminUsername: needsAdminApproval ? adminUsername.trim() : undefined,
        adminPassword: needsAdminApproval ? adminPassword : undefined,
      }).then((result) => {
        if (!result.ok) {
          setNotice(result.error.message);
          if (result.error.code === "ADMIN_APPROVAL_FAILED") setAdminPassword("");
          return;
        }
        setOpen(false);
        reset();
        router.refresh();
      });
    });
  };

  return (
    <>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-status-danger-bg bg-status-danger-bg px-3 py-2 text-sm font-bold text-status-danger-text transition hover:bg-status-danger-bg disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => {
          setNotice(null);
          setStep("details");
          setOpen(true);
        }}
        type="button"
      >
        <Ban className="size-4" />
        Void sale
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <section aria-modal="true" className="w-full max-w-2xl rounded-3xl bg-neutral-surface p-6 shadow-2xl sm:p-7" role="dialog">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-status-danger-text">Sale void</p>
                <h2 className="mt-1 text-2xl font-black text-neutral-text">{saleNumber}</h2>
                <p className="mt-2 text-sm leading-6 text-neutral-muted">
                  Full void only in this phase. Customer-returned medicines should not be returned to sellable stock.
                </p>
              </div>
              <button
                aria-label="Close"
                className="grid size-9 place-items-center rounded-full text-neutral-muted hover:bg-slate-100"
                disabled={isPending}
                onClick={close}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>

            {onApprovalStep ? (
              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-status-warning-bg bg-status-warning-bg p-4 text-sm leading-6 text-status-warning-text">
                  Step 2 of 2: an admin must approve this void. Enter an admin&apos;s username and password.
                </div>
                <label className="grid gap-2 text-sm font-bold text-neutral-text">
                  Admin username
                  <input
                    autoComplete="off"
                    className="rounded-xl border border-neutral-border px-4 py-3 font-normal outline-none focus:border-rose-400"
                    onChange={(event) => setAdminUsername(event.target.value)}
                    value={adminUsername}
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-neutral-text">
                  Admin password
                  <input
                    autoComplete="new-password"
                    className="rounded-xl border border-neutral-border px-4 py-3 font-normal outline-none focus:border-rose-400"
                    onChange={(event) => setAdminPassword(event.target.value)}
                    type="password"
                    value={adminPassword}
                  />
                </label>
              </div>
            ) : null}

            <div className={`mt-6 grid gap-4 sm:grid-cols-2 ${onApprovalStep ? "hidden" : ""}`}>
              <label className="grid gap-2 text-sm font-bold text-neutral-text sm:col-span-2">
                Void reason
                <textarea
                  className="min-h-28 rounded-xl border border-neutral-border px-4 py-3 font-normal outline-none focus:border-rose-400"
                  maxLength={500}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Explain why the completed sale is being voided"
                  value={reason}
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-neutral-text">
                Refund amount
                <input
                  className="rounded-xl border border-neutral-border px-4 py-3 font-normal outline-none"
                  readOnly
                  value={formatMoney(total)}
                />
                <span className="text-xs font-medium text-neutral-muted">Full voids always refund the full sale total.</span>
              </label>

              <label className="grid gap-2 text-sm font-bold text-neutral-text">
                Refund method
                <select
                  className="rounded-xl border border-neutral-border px-4 py-3 font-normal outline-none focus:border-rose-400"
                  onChange={(event) => setRefundMethod(event.target.value as "" | "CASH" | "CARD")}
                  value={refundMethod}
                >
                  <option value="">Not recorded</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-bold text-neutral-text sm:col-span-2">
                Refund reference
                <input
                  className="rounded-xl border border-neutral-border px-4 py-3 font-normal outline-none focus:border-rose-400"
                  onChange={(event) => setRefundReference(event.target.value)}
                  placeholder="Optional refund / reversal reference"
                  value={refundReference}
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-neutral-text sm:col-span-2">
                Stock policy
                <select
                  className="rounded-xl border border-neutral-border px-4 py-3 font-normal outline-none focus:border-rose-400"
                  onChange={(event) => setStockPolicy(event.target.value as "NO_STOCK_RETURN" | "RETURN_TO_ACTIVE")}
                  value={stockPolicy}
                >
                  <option value="NO_STOCK_RETURN">NO_STOCK_RETURN</option>
                  <option value="RETURN_TO_ACTIVE">RETURN_TO_ACTIVE</option>
                </select>
              </label>
            </div>

            <div className={`mt-4 rounded-2xl border border-status-warning-bg bg-status-warning-bg p-4 text-sm leading-6 text-status-warning-text ${onApprovalStep ? "hidden" : ""}`}>
              <div className="flex items-start gap-2">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <p>
                  Use `RETURN_TO_ACTIVE` only when the item never left the counter and the stock is still safe to sell. Returned medicines
                  should not be placed back into active stock unless the pharmacist confirms that is safe.
                </p>
              </div>
            </div>

            {notice ? (
              <div className="mt-4 rounded-2xl border border-status-danger-bg bg-status-danger-bg p-4 text-sm font-medium text-status-danger-text">
                {notice}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-xl border border-neutral-border px-4 py-3 font-bold text-neutral-muted"
                disabled={isPending}
                onClick={close}
                type="button"
              >
                Cancel
              </button>
              {onApprovalStep ? (
                <button
                  className="rounded-xl border border-neutral-border px-4 py-3 font-bold text-neutral-muted"
                  disabled={isPending}
                  onClick={() => {
                    setNotice(null);
                    setStep("details");
                  }}
                  type="button"
                >
                  Back
                </button>
              ) : null}
              <button
                className="rounded-xl bg-rose-700 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!canSubmit}
                onClick={submit}
                type="button"
              >
                {isPending ? "Voiding..." : needsAdminApproval && step === "details" ? "Continue" : onApprovalStep ? "Verify & void" : "Confirm void"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
