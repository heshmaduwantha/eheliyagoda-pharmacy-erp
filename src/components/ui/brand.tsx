import Image from "next/image";

export function Brand({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-neutral-surface shadow-sm">
        <Image
          src="/medical-cross-logo.png"
          alt="Medicare Logo"
          width={44}
          height={44}
          className="size-11 object-contain p-1.5"
          style={{ filter: inverse ? "brightness(0) invert(1)" : "brightness(0) saturate(100%) invert(32%) sepia(87%) saturate(3015%) hue-rotate(211deg) brightness(98%) contrast(100%)" }}
          priority
        />
      </div>
      {!compact && (
        <span>
          <strong className={`block text-xl font-extrabold tracking-tight ${inverse ? "text-white" : "text-neutral-text"}`}>
            Medicare
          </strong>
          <span className={`block text-xs ${inverse ? "text-brand-default/70" : "text-neutral-muted"}`}>
            Pharmacy ERP
          </span>
        </span>
      )}
    </div>
  );
}
