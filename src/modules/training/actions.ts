"use server";

import { TrainingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { allTrainingLessons } from "@/content/training/catalog";
import { requireAuth } from "@/modules/auth/permissions";
import { updateTrainingProgress } from "./training.service";

export async function saveTrainingProgressAction(input: {
  lessonKey: string;
  status: "IN_PROGRESS" | "COMPLETED";
  lastStep: number;
}) {
  const actor = await requireAuth({ onDenied: "throw" });
  const lesson = allTrainingLessons.find((item) => item.key === input.lessonKey);
  if (!lesson) return { ok: false as const, message: "Training lesson not found." };

  const lastStep = Math.max(0, Math.min(Math.trunc(input.lastStep), lesson.steps.length));
  const status = input.status === "COMPLETED" ? TrainingStatus.COMPLETED : TrainingStatus.IN_PROGRESS;
  await updateTrainingProgress({ userId: actor.id, lessonKey: lesson.key, status, lastStep });

  revalidatePath("/training");
  revalidatePath(`/training/${lesson.kind === "scenario" ? "scenarios" : "modules"}/${lesson.slug}`);
  return { ok: true as const };
}
