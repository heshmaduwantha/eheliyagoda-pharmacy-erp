import { TrainingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serverOnly } from "@/lib/server-only";

serverOnly();

export function listTrainingProgress(userId: string) {
  return prisma.trainingProgress.findMany({
    where: { userId },
    select: { lessonKey: true, status: true, lastStep: true, completedAt: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function updateTrainingProgress(input: {
  userId: string;
  lessonKey: string;
  status: TrainingStatus;
  lastStep: number;
}) {
  return prisma.trainingProgress.upsert({
    where: { userId_lessonKey: { userId: input.userId, lessonKey: input.lessonKey } },
    create: {
      userId: input.userId,
      lessonKey: input.lessonKey,
      status: input.status,
      lastStep: input.lastStep,
      completedAt: input.status === TrainingStatus.COMPLETED ? new Date() : null,
    },
    update: {
      status: input.status,
      lastStep: input.lastStep,
      completedAt: input.status === TrainingStatus.COMPLETED ? new Date() : null,
    },
  });
}
