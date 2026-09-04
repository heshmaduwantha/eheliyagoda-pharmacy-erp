"use client";

import { useState, useTransition } from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";
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
        aria-label={isActive ? "Deactivate supplier" : "Activate supplier"}
        className={`grid size-8 place-items-center rounded-lg border transition shadow-xs ${
          isActive
            ? "border-red-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        }`}
        disabled={isPending}
        onClick={() => setIsOpen(true)}
        title={isActive ? "Deactivate supplier" : "Activate supplier"}
        type="button"
      >
        {isActive ? <ToggleRight className="size-5 text-rose-600" /> : <ToggleLeft className="size-5 text-emerald-600" />}
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
