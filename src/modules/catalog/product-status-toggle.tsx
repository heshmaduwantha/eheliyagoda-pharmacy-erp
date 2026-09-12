"use client";

import { useState, useTransition } from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { setProductActiveAction } from "./actions";
import { toast } from "sonner";

type ProductStatusToggleProps = {
  productId: string;
  productName: string;
  isActive: boolean;
};

export function ProductStatusToggle({ productId, productName, isActive }: ProductStatusToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const nextActive = !isActive;

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await setProductActiveAction(productId, nextActive);
        toast.success(`${productName} ${nextActive ? "activated" : "disabled"}.`);
        setIsOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update product status.");
      }
    });
  };

  return (
    <>
      <button
        aria-label={isActive ? "Disable product" : "Activate product"}
        className={`grid size-8 place-items-center rounded-lg border transition shadow-xs ${
          isActive
            ? "border-red-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        }`}
        disabled={isPending}
        onClick={() => setIsOpen(true)}
        title={isActive ? "Disable product" : "Activate product"}
        type="button"
      >
        {isActive ? <ToggleRight className="size-5 text-rose-600" /> : <ToggleLeft className="size-5 text-emerald-600" />}
      </button>

      <ConfirmDialog
        confirmText={nextActive ? "Activate product" : "Disable product"}
        description={nextActive ? `Activate ${productName}? It will become available across POS and inventory.` : `Disable ${productName}? It will no longer appear anywhere in POS, GRN, or inventory searches.`}
        isDestructive={!nextActive}
        isOpen={isOpen}
        isPending={isPending}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        title={nextActive ? "Activate product" : "Disable product"}
      />
    </>
  );
}
