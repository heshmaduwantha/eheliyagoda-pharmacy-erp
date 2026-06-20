import Link from "next/link";
import { ArrowLeft, ShieldX } from "lucide-react";

export default function ForbiddenPage() {
  return <section className="grid min-h-[65vh] place-items-center"><div className="max-w-md text-center"><span className="mx-auto grid size-24 place-items-center rounded-full bg-red-50 text-red-500"><ShieldX className="size-11" /></span><p className="mt-6 text-sm font-bold uppercase tracking-[.18em] text-red-500">Access denied</p><h1 className="mt-2 text-4xl font-black text-slate-900">Permission required</h1><p className="mt-4 leading-7 text-slate-500">Your current role does not allow access to this protected workspace.</p><Link className="mt-7 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-bold text-white shadow-lg shadow-teal-700/20" href="/dashboard"><ArrowLeft className="size-4" />Back to dashboard</Link></div></section>;
}
