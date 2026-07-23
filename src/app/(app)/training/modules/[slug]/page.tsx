import { TrainingLessonPage } from "@/components/training/TrainingLessonPage";

export default async function ModuleTrainingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TrainingLessonPage kind="modules" slug={slug} />;
}
