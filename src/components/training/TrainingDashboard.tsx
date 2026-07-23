"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowRight, BookOpenCheck, CheckCircle2, Clock3, Search, SlidersHorizontal } from "lucide-react";
import type { TrainingCategory, TrainingLesson } from "@/content/training/types";
import { searchTrainingLessons } from "@/content/training/catalog";
import { BusinessCycleMap } from "./BusinessCycleMap";

type ProgressRow = { lessonKey: string; status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"; lastStep: number };

const lessonHref = (lesson: TrainingLesson) => `/training/${lesson.kind === "scenario" ? "scenarios" : "modules"}/${lesson.slug}`;

export function TrainingDashboard({ lessons, categories, progress }: { lessons: TrainingLesson[]; categories: TrainingCategory[]; progress: ProgressRow[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [completion, setCompletion] = useState("all");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase("si"));
  const progressByKey = useMemo(() => new Map(progress.map((row) => [row.lessonKey, row])), [progress]);

  const visible = useMemo(() => searchTrainingLessons(deferredQuery, lessons).filter((lesson) => {
    const row = progressByKey.get(lesson.key);
    if (category !== "all" && lesson.category !== category) return false;
    if (difficulty !== "all" && lesson.difficulty !== difficulty) return false;
    if (completion === "completed" && row?.status !== "COMPLETED") return false;
    if (completion === "open" && row?.status === "COMPLETED") return false;
    return true;
  }), [category, completion, deferredQuery, difficulty, lessons, progressByKey]);

  const completedCount = lessons.filter((lesson) => progressByKey.get(lesson.key)?.status === "COMPLETED").length;
  const overall = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;
  const lastLesson = progress.map((row) => lessons.find((lesson) => lesson.key === row.lessonKey)).find(Boolean) ?? lessons[0];

  const categoryRows = categories.map((item) => {
    const categoryLessons = visible.filter((lesson) => lesson.category === item.key);
    const completed = categoryLessons.filter((lesson) => progressByKey.get(lesson.key)?.status === "COMPLETED").length;
    return { ...item, lessons: categoryLessons, completed, minutes: categoryLessons.reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0) };
  }).filter((item) => item.lessons.length > 0);

  return (
    <div className="grid min-w-0 max-w-full gap-6 overflow-x-hidden">
      <section className="min-w-0 max-w-full overflow-hidden rounded-3xl border border-brand-default/20 bg-[linear-gradient(135deg,#ffffff_0%,#f0fdfa_70%,#ecfeff_100%)] p-5 shadow-sm sm:p-8">
        <div className="grid gap-7 xl:grid-cols-[1.2fr_.8fr] xl:items-end">
          <div className="min-w-0"><h1 className="max-w-4xl break-words text-3xl font-black tracking-tight text-neutral-text sm:text-4xl">Eheliyagoda Pharmacy ERP පුහුණු මාර්ගෝපදේශය</h1><p className="mt-3 max-w-3xl text-base leading-7 text-neutral-muted">Setup සිට GRN, Batch stock, POS sale, supplier payment සහ Reports දක්වා සම්පූර්ණ pharmacy business cycle එක practical examples සමඟ ඉගෙන ගන්න.</p></div>
          <div className="rounded-2xl border border-white bg-neutral-surface/85 p-4 shadow-sm"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-neutral-muted">Overall progress</p><p className="mt-1 text-3xl font-black text-brand-default">{overall}%</p></div><p className="text-sm font-semibold text-neutral-muted">{completedCount}/{lessons.length} lessons</p></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-default" style={{ width: `${overall}%` }} /></div>{lastLesson ? <Link className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-default px-4 py-3 text-sm font-bold text-white" href={lessonHref(lastLesson)}>අවසන් පාඩම දිගටම කරගෙන යන්න<ArrowRight className="size-4" /></Link> : null}</div>
        </div>
        <label className="mt-7 flex max-w-2xl items-center gap-3 rounded-2xl border border-neutral-border bg-neutral-surface px-4 py-3 shadow-sm"><Search className="size-5 text-brand-default" /><input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-muted" onChange={(event) => setQuery(event.target.value)} placeholder="පාඩම් සොයන්න — Product, GRN, POS..." value={query} /></label>
      </section>

      <BusinessCycleMap />

      <section className="min-w-0 max-w-full overflow-hidden rounded-3xl border border-neutral-border bg-neutral-surface shadow-sm">
        <div className="grid gap-4 border-b border-neutral-border p-4 sm:grid-cols-3 sm:p-5">
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-neutral-muted">Category<select className="rounded-xl border border-neutral-border px-3 py-2.5 text-sm font-semibold normal-case text-neutral-text" onChange={(event) => setCategory(event.target.value)} value={category}><option value="all">All categories</option>{categories.map((item) => <option key={item.key} value={item.key}>{item.titleSi}</option>)}</select></label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-neutral-muted">Difficulty<select className="rounded-xl border border-neutral-border px-3 py-2.5 text-sm font-semibold normal-case text-neutral-text" onChange={(event) => setDifficulty(event.target.value)} value={difficulty}><option value="all">All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-neutral-muted">Progress<select className="rounded-xl border border-neutral-border px-3 py-2.5 text-sm font-semibold normal-case text-neutral-text" onChange={(event) => setCompletion(event.target.value)} value={completion}><option value="all">All lessons</option><option value="completed">Completed</option><option value="open">Not completed</option></select></label>
        </div>
        <div className="divide-y divide-slate-100">
          {categoryRows.map((item) => {
            const percentage = item.lessons.length ? Math.round((item.completed / item.lessons.length) * 100) : 0;
            const first = item.lessons.find((lesson) => progressByKey.get(lesson.key)?.status !== "COMPLETED") ?? item.lessons[0];
            return <article className="grid gap-4 p-5 transition hover:bg-brand-pale/30 md:grid-cols-[1fr_auto] md:items-center sm:p-6" key={item.key}><div><div className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-pale text-brand-default"><BookOpenCheck className="size-5" /></span><div><h2 className="text-lg font-black text-neutral-text">{item.titleSi}</h2><p className="text-sm text-neutral-muted">{item.titleEn} · {item.descriptionSi}</p></div></div>{deferredQuery ? <div className="mt-4 flex flex-wrap gap-2">{item.lessons.map((lesson) => <Link className="rounded-lg border border-brand-default/20 bg-brand-pale px-3 py-1.5 text-sm font-bold text-brand-default hover:bg-brand-pale" href={lessonHref(lesson)} key={lesson.key}>{lesson.titleSi} · {lesson.titleEn}</Link>)}</div> : null}<div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-neutral-muted"><span>{item.lessons.length} lessons</span><span className="flex items-center gap-1"><Clock3 className="size-3.5" />{item.minutes} min</span><span className="flex items-center gap-1"><CheckCircle2 className="size-3.5" />{percentage}% complete</span></div><div className="mt-3 h-1.5 max-w-xl overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-default" style={{ width: `${percentage}%` }} /></div></div>{first ? <Link className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-default/20 bg-neutral-surface px-4 py-2.5 text-sm font-bold text-brand-default hover:bg-brand-pale" href={lessonHref(first)}>{progressByKey.has(first.key) ? "Continue" : "Start"}<ArrowRight className="size-4" /></Link> : null}</article>;
          })}
          {categoryRows.length === 0 ? <div className="grid place-items-center p-12 text-center"><SlidersHorizontal className="size-8 text-slate-300" /><p className="mt-3 font-bold text-neutral-text">මෙම filters වලට ගැළපෙන පාඩම් නැත.</p></div> : null}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2"><Link className="rounded-2xl border border-neutral-border bg-neutral-surface p-5 font-bold text-neutral-text hover:border-brand-default/20" href="/training/glossary">සිංහල Glossary <ArrowRight className="ml-2 inline size-4 text-brand-default" /></Link><Link className="rounded-2xl border border-neutral-border bg-neutral-surface p-5 font-bold text-neutral-text hover:border-brand-default/20" href="/training/troubleshooting">Troubleshooting guide <ArrowRight className="ml-2 inline size-4 text-brand-default" /></Link></div>
    </div>
  );
}
