export type TrainingDifficulty = "beginner" | "intermediate" | "advanced";
export type TrainingKind = "scenario" | "module";

export type TrainingStep = {
  title: string;
  page: string;
  action: string;
  fields?: string[];
  example?: string;
  result: string;
};

export type TrainingNotice = {
  tone: "info" | "warning" | "danger" | "success";
  title: string;
  body: string;
};

export type TrainingLesson = {
  key: string;
  slug: string;
  kind: TrainingKind;
  category: string;
  titleSi: string;
  titleEn: string;
  summarySi: string;
  difficulty: TrainingDifficulty;
  estimatedMinutes: number;
  businessContext: string;
  prerequisites: string[];
  requiredPermissions: string[];
  relatedRoute?: string;
  relatedRouteLabel?: string;
  unavailable?: boolean;
  steps: TrainingStep[];
  dataImpacts: string[];
  notices: TrainingNotice[];
  checklist: string[];
  relatedLessons: string[];
  diagram?: { label: string; note: string }[];
};

export type TrainingCategory = {
  key: string;
  titleSi: string;
  titleEn: string;
  descriptionSi: string;
};
