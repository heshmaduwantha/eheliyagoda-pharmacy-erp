import { Pill, Plus } from "lucide-react";

export function Brand({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return <div className="flex items-center gap-3"><span className={`relative grid size-11 place-items-center rounded-2xl ${inverse ? "bg-white/12 text-white" : "bg-teal-50 text-teal-700"}`}><Plus className="size-7" strokeWidth={3} /><Pill className={`absolute -bottom-0.5 -right-1 size-5 rotate-[-42deg] rounded-full ${inverse ? "bg-teal-400 text-teal-950" : "bg-white text-teal-600"}`} strokeWidth={2.4} /></span>{!compact && <span><strong className={`block text-xl font-extrabold tracking-tight ${inverse ? "text-white" : "text-slate-900"}`}>Medisquare</strong><span className={`block text-xs ${inverse ? "text-teal-100/70" : "text-slate-500"}`}>Pharmacy + Clinic ERP</span></span>}</div>;
}
