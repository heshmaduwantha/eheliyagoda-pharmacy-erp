import { allTrainingLessons, trainingCategories } from "@/content/training/catalog";
import { TrainingDashboard } from "@/components/training/TrainingDashboard";
import { requireAuth } from "@/modules/auth/permissions";
import { listTrainingProgress } from "@/modules/training/training.service";

export default async function TrainingPage() {
  const actor = await requireAuth();
  const progress = await listTrainingProgress(actor.id);
  return <TrainingDashboard categories={trainingCategories} lessons={allTrainingLessons} progress={progress.map((row) => ({ lessonKey: row.lessonKey, status: row.status, lastStep: row.lastStep }))} />;
}
