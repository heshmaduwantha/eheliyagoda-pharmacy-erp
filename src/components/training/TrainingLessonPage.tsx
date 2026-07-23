import { notFound } from "next/navigation";
import { allTrainingLessons, findTrainingLesson } from "@/content/training/catalog";
import { hasPermission, requireAuth } from "@/modules/auth/permissions";
import { listTrainingProgress } from "@/modules/training/training.service";
import { LessonLayout } from "./LessonLayout";
import { permissionForTrainingRoute } from "@/content/training/routes";

export async function TrainingLessonPage({ kind, slug }: { kind: "scenarios" | "modules"; slug: string }) {
  const actor = await requireAuth();
  const lesson = findTrainingLesson(kind, slug);
  if (!lesson) notFound();

  const progress = await listTrainingProgress(actor.id);
  const completed = progress.some((row) => row.lessonKey === lesson.key && row.status === "COMPLETED");
  const index = allTrainingLessons.findIndex((item) => item.key === lesson.key);
  const relatedRoutePermission = permissionForTrainingRoute(lesson.relatedRoute);
  const canOpenRelatedRoute = !relatedRoutePermission || hasPermission(actor, relatedRoutePermission);

  return <LessonLayout canOpenRelatedRoute={canOpenRelatedRoute} completed={completed} lesson={lesson} next={allTrainingLessons[index + 1]} previous={allTrainingLessons[index - 1]} />;
}
