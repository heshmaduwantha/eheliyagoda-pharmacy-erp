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
        className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? "border border-status-danger-bg bg-status-danger-bg text-status-danger-text hover:bg-status-danger-bg" : "border border-status-success-bg bg-status-success-bg text-status-success-text hover:bg-status-success-bg"}`}
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
