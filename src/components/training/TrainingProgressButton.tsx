"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { saveTrainingProgressAction } from "@/modules/training/actions";

export function TrainingProgressButton({ lessonKey, stepCount, completed }: { lessonKey: string; stepCount: number; completed: boolean }) {
  const [isCompleted, setIsCompleted] = useState(completed);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="print:hidden">
      <button
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition sm:w-auto ${isCompleted ? "border border-status-success-bg bg-status-success-bg text-status-success-text" : "bg-brand-default text-white shadow-lg shadow-teal-900/15"}`}
        disabled={pending || isCompleted}
        onClick={() => startTransition(async () => {
          setNotice(null);
          const result = await saveTrainingProgressAction({ lessonKey, status: "COMPLETED", lastStep: stepCount });
          if (result.ok) setIsCompleted(true);
          else setNotice(result.message);
        })}
        type="button"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        {isCompleted ? "පාඩම සම්පූර්ණයි" : "පාඩම සම්පූර්ණ ලෙස සලකුණු කරන්න"}
      </button>
      {notice ? <p className="mt-2 text-sm font-semibold text-status-danger-text">{notice}</p> : null}
    </div>
  );
}
