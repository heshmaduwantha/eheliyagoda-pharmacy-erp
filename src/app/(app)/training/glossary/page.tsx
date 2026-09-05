import Link from "next/link";
import { ArrowLeft, BookOpenText } from "lucide-react";
import { glossary } from "@/content/training/catalog";
import { requireAuth } from "@/modules/auth/permissions";

export default async function TrainingGlossaryPage() {
  await requireAuth();
  return <div className="mx-auto max-w-5xl"><Link className="inline-flex items-center gap-2 text-sm font-bold text-brand-default" href="/training"><ArrowLeft className="size-4" />පුහුණු මාර්ගෝපදේශයට</Link><header className="mt-5 rounded-3xl border border-brand-default/20 bg-neutral-surface p-6 shadow-sm sm:p-8"><BookOpenText className="size-8 text-brand-default" /><h1 className="mt-4 text-2xl font-black tracking-tight text-neutral-text sm:text-3xl">සිංහල Pharmacy ERP Glossary</h1><p className="mt-2 leading-7 text-neutral-muted">ERP එකේ නිතර පෙනෙන English terms සරල සිංහලෙන්.</p></header><div className="mt-6 divide-y divide-slate-100 rounded-3xl border border-neutral-border bg-neutral-surface shadow-sm">{glossary.map(([term, meaning, example]) => <section className="grid gap-2 p-5 sm:grid-cols-[180px_1fr] sm:p-6" key={term}><h2 className="font-black text-brand-default">{term}</h2><div><p className="leading-7 text-neutral-text">{meaning}</p><p className="mt-1 text-sm text-neutral-muted"><strong>උදාහරණය:</strong> {example}</p></div></section>)}</div></div>;
}
