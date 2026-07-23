import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, ExternalLink, Info, ShieldAlert, Sparkles } from "lucide-react";
import type { TrainingLesson } from "@/content/training/types";
import { lessonByKey } from "@/content/training/catalog";
import { TrainingProgressButton } from "./TrainingProgressButton";
import { PrintButton } from "./PrintButton";
import { TrainingScreenshot } from "./TrainingScreenshot";

const noticeStyle = {
  info: "border-blue-100 bg-blue-50 text-blue-900",
  success: "border-status-success-bg bg-status-success-bg text-status-success-text",
  warning: "border-status-warning-bg bg-status-warning-bg text-amber-950",
  danger: "border-status-danger-bg bg-status-danger-bg text-rose-950",
} as const;

const lessonHref = (lesson: TrainingLesson) => `/training/${lesson.kind === "scenario" ? "scenarios" : "modules"}/${lesson.slug}`;

export function LessonLayout({ lesson, completed, canOpenRelatedRoute, previous, next }: { lesson: TrainingLesson; completed: boolean; canOpenRelatedRoute: boolean; previous?: TrainingLesson; next?: TrainingLesson }) {
  return (
    <article className="training-lesson mx-auto max-w-5xl">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-neutral-muted print:hidden"><Link className="font-semibold text-brand-default" href="/training">පුහුණු මාර්ගෝපදේශය</Link><span>/</span><span>{lesson.kind === "scenario" ? "Scenario" : "Module"}</span><span>/</span><span className="text-neutral-text">{lesson.titleEn}</span></nav>

      <header className="overflow-hidden rounded-3xl border border-brand-default/20 bg-[linear-gradient(135deg,#ffffff_0%,#ecfdf5_100%)] p-6 shadow-sm sm:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-3xl font-black tracking-tight text-neutral-text sm:text-4xl">{lesson.titleSi}</h1><p className="mt-2 text-lg font-semibold text-brand-default">{lesson.titleEn}</p><p className="mt-4 max-w-3xl leading-7 text-neutral-muted">{lesson.summarySi}</p></div><PrintButton /></div>
        <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold"><span className="rounded-full bg-neutral-surface px-3 py-1.5 text-neutral-muted shadow-sm">{lesson.difficulty}</span><span className="flex items-center gap-1.5 rounded-full bg-neutral-surface px-3 py-1.5 text-neutral-muted shadow-sm"><Clock3 className="size-4" />{lesson.estimatedMinutes} min</span>{lesson.unavailable ? <span className="rounded-full bg-status-danger-bg px-3 py-1.5 text-status-danger-text">Current workflow unavailable</span> : null}</div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="grid gap-6">
          <section className="rounded-3xl border border-neutral-border bg-neutral-surface p-5 shadow-sm sm:p-7"><h2 className="flex items-center gap-2 text-xl font-black text-neutral-text"><BookOpen className="size-5 text-brand-default" />මෙය pharmacy එකේ අවශ්‍ය ඇයි?</h2><p className="mt-3 leading-7 text-neutral-muted">{lesson.businessContext}</p></section>

          <section className="rounded-3xl border border-neutral-border bg-neutral-surface p-5 shadow-sm sm:p-7"><h2 className="text-xl font-black text-neutral-text">ආරම්භ කිරීමට පෙර</h2><ul className="mt-4 grid gap-3">{lesson.prerequisites.map((item) => <li className="flex gap-3 text-sm leading-6 text-neutral-muted" key={item}><CheckCircle2 className="mt-1 size-4 shrink-0 text-brand-default" />{item}</li>)}</ul>{lesson.requiredPermissions.length ? <div className="mt-5 rounded-2xl bg-neutral-bg p-4"><p className="text-xs font-bold uppercase tracking-wide text-neutral-muted">Required permissions</p><p className="mt-2 font-mono text-xs leading-6 text-neutral-text">{lesson.requiredPermissions.join(" · ")}</p></div> : null}</section>

          {lesson.diagram ? <section className="rounded-3xl border border-neutral-border bg-neutral-surface p-5 shadow-sm sm:p-7"><h2 className="text-xl font-black text-neutral-text">Flow එක</h2><div className="mt-5 flex snap-x gap-2 overflow-x-auto pb-2">{lesson.diagram.map((node, index) => <div className="flex shrink-0 items-center gap-2" key={`${node.label}-${index}`}><div className="min-w-36 snap-start rounded-2xl border border-brand-default/20 bg-brand-pale p-4 text-center"><p className="font-black text-brand-default">{node.label}</p><p className="mt-1 text-xs leading-5 text-brand-default">{node.note}</p></div>{index < lesson.diagram!.length - 1 ? <ArrowRight className="size-4 text-slate-300" /> : null}</div>)}</div></section> : null}

          <section><div className="mb-4"><h2 className="text-2xl font-black text-neutral-text">පියවරෙන් පියවර</h2><p className="mt-1 text-sm text-neutral-muted">එක් action එකක් අවසන් කර පසුව ඊළඟ පියවරට යන්න.</p></div><ol className="grid gap-4">{lesson.steps.map((step, index) => <li className="rounded-3xl border border-neutral-border bg-neutral-surface p-5 shadow-sm sm:p-6" key={`${step.title}-${index}`}><div className="flex gap-4"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-default text-sm font-black text-white">{index + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between"><h3 className="text-lg font-black text-neutral-text">{step.title}</h3><span className="text-xs font-bold uppercase tracking-wide text-brand-default">{step.page}</span></div><p className="mt-3 leading-7 text-neutral-muted">{step.action}</p>{step.fields?.length ? <div className="mt-4 rounded-2xl bg-neutral-bg p-4"><p className="text-xs font-bold uppercase tracking-wide text-neutral-muted">Fields</p><p className="mt-2 text-sm leading-6 text-neutral-text">{step.fields.join(" · ")}</p></div> : null}{step.example ? <p className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900"><strong>Example:</strong> {step.example}</p> : null}<div className="mt-4 flex items-start gap-2 rounded-2xl border border-status-success-bg bg-status-success-bg p-4 text-sm leading-6 text-status-success-text"><Sparkles className="mt-0.5 size-4 shrink-0" /><p><strong>මෙය කළ පසු:</strong> {step.result}</p></div></div></div></li>)}</ol></section>

          <TrainingScreenshot alt={`${lesson.titleSi} පාඩමට අදාල ERP තිර රූපය`} caption={`${lesson.titleEn} — actual UI screenshot placeholder`} />

          <section className="rounded-3xl border border-neutral-border bg-slate-900 p-5 text-white shadow-sm sm:p-7"><h2 className="text-xl font-black">System එක තුළ සිදුවන්නේ කුමක්ද?</h2><ul className="mt-4 grid gap-3">{lesson.dataImpacts.map((impact) => <li className="flex gap-3 text-sm leading-6 text-slate-200" key={impact}><CheckCircle2 className="mt-1 size-4 shrink-0 text-brand-default" />{impact}</li>)}</ul></section>

          <section className="grid gap-3">{lesson.notices.map((notice) => <div className={`rounded-2xl border p-5 ${noticeStyle[notice.tone]}`} key={notice.title}><div className="flex items-start gap-3">{notice.tone === "danger" ? <ShieldAlert className="mt-0.5 size-5 shrink-0" /> : notice.tone === "warning" ? <AlertTriangle className="mt-0.5 size-5 shrink-0" /> : <Info className="mt-0.5 size-5 shrink-0" />}<div><h3 className="font-black">{notice.title}</h3><p className="mt-1 text-sm leading-6">{notice.body}</p></div></div></div>)}</section>

          <section className="rounded-3xl border border-neutral-border bg-neutral-surface p-5 shadow-sm sm:p-7"><h2 className="text-xl font-black text-neutral-text">Completion checklist</h2><div className="mt-4 grid gap-3">{lesson.checklist.map((item) => <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-border p-3 text-sm leading-6 text-neutral-text" key={item}><input className="mt-1 size-4 accent-teal-700" type="checkbox" />{item}</label>)}</div><div className="mt-6"><TrainingProgressButton completed={completed} lessonKey={lesson.key} stepCount={lesson.steps.length} /></div></section>
        </div>

        <aside className="grid gap-4 lg:sticky lg:top-24 print:hidden">
          {lesson.relatedRoute ? <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-4 shadow-sm"><p className="text-sm font-black text-neutral-text">Actual system page</p>{canOpenRelatedRoute ? <Link className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-default px-4 py-3 text-sm font-bold text-white" href={lesson.relatedRoute}>{lesson.relatedRouteLabel ?? "Page එක විවෘත කරන්න"}<ExternalLink className="size-4" /></Link> : <p className="mt-3 rounded-xl bg-status-warning-bg p-3 text-xs leading-5 text-status-warning-text">ඔබගේ role එකට මෙම operational link එක පෙන්විය නොහැක.</p>}</div> : null}
          {lesson.relatedLessons.length ? <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-4 shadow-sm"><p className="text-sm font-black text-neutral-text">Related lessons</p><div className="mt-3 grid gap-2">{lesson.relatedLessons.map((key) => { const related = lessonByKey.get(key); return related ? <Link className="rounded-xl bg-neutral-bg px-3 py-2.5 text-sm font-semibold text-neutral-text hover:bg-brand-pale hover:text-brand-hover" href={lessonHref(related)} key={key}>{related.titleSi}</Link> : null; })}</div></div> : null}
        </aside>
      </div>

      <nav className="mt-8 grid gap-3 border-t border-neutral-border pt-6 sm:grid-cols-2 print:hidden">{previous ? <Link className="rounded-2xl border border-neutral-border bg-neutral-surface p-4 text-sm font-bold text-neutral-text hover:border-brand-default/20" href={lessonHref(previous)}><span className="flex items-center gap-2 text-xs uppercase tracking-wide text-neutral-muted"><ArrowLeft className="size-3.5" />Previous</span><span className="mt-1 block">{previous.titleSi}</span></Link> : <span />}{next ? <Link className="rounded-2xl border border-neutral-border bg-neutral-surface p-4 text-right text-sm font-bold text-neutral-text hover:border-brand-default/20" href={lessonHref(next)}><span className="flex items-center justify-end gap-2 text-xs uppercase tracking-wide text-neutral-muted">Next<ArrowRight className="size-3.5" /></span><span className="mt-1 block">{next.titleSi}</span></Link> : null}</nav>
    </article>
  );
}
