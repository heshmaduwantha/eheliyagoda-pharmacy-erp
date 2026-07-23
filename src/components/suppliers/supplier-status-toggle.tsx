"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { setSupplierActiveAction } from "@/modules/procurement/actions";
import { toast } from "sonner";

type SupplierStatusToggleProps = {
  supplierId: string;
  supplierName: string;
  isActive: boolean;
};

export function SupplierStatusToggle({ supplierId, supplierName, isActive }: SupplierStatusToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const nextActive = !isActive;

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await setSupplierActiveAction(supplierId, nextActive);
        toast.success(`${supplierName} ${nextActive ? "activated" : "deactivated"}.`);
        setIsOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update supplier status.");
      }
    });
  };

  return (
    <>
      <button
        className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
        disabled={isPending}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {isActive ? "Deactivate" : "Activate"}
      </button>

      <ConfirmDialog
        confirmText={nextActive ? "Activate supplier" : "Deactivate supplier"}
        description={nextActive ? `Activate ${supplierName} so it can be selected for new GRNs?` : `Deactivate ${supplierName}? It will no longer be available for new GRNs.`}
        isDestructive={!nextActive}
        isOpen={isOpen}
        isPending={isPending}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        title={nextActive ? "Activate supplier" : "Deactivate supplier"}
      />
    </>
  );
}
