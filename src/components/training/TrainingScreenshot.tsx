import Image from "next/image";
import { ImageIcon } from "lucide-react";

export function TrainingScreenshot({ src, alt, caption }: { src?: string; alt: string; caption: string }) {
  return (
    <figure className="overflow-hidden rounded-3xl border border-neutral-border bg-neutral-surface shadow-sm">
      {src ? (
        <a className="block bg-slate-100" href={src} target="_blank" rel="noreferrer">
          <Image alt={alt} className="h-auto w-full object-contain" height={900} src={src} width={1440} />
        </a>
      ) : (
        <div className="grid min-h-56 place-items-center bg-[linear-gradient(135deg,#f8fafc,#ecfdf5)] p-8 text-center">
          <div><ImageIcon className="mx-auto size-9 text-brand-default" /><p className="mt-3 font-bold text-neutral-text">මෙම ස්ථානයට අදාල තිර රූපය එක් කරන්න</p><p className="mt-1 text-xs text-neutral-muted">Convention: /public/training/&lt;module&gt;/&lt;step&gt;.webp</p></div>
        </div>
      )}
      <figcaption className="border-t border-neutral-border px-5 py-3 text-sm text-neutral-muted">{caption}</figcaption>
    </figure>
  );
}
