import { TrainingLessonPage } from "@/components/training/TrainingLessonPage";

export default async function ScenarioTrainingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TrainingLessonPage kind="scenarios" slug={slug} />;
}
