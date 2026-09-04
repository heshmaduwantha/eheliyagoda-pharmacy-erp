import Image from "next/image";

export function Brand({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <div className={`flex items-center ${compact ? "justify-center" : "gap-3"}`}>
      <div className={`relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl ${inverse ? "shadow-md shadow-black/10 ring-1 ring-white/20" : "shadow-sm"}`}>
        <Image
          src="/medical-cross-logo.png"
          alt="Medisquare Logo"
          width={44}
          height={44}
          className="size-11 object-contain"
          priority
        />
      </div>
      {!compact && (
        <span>
          <strong className={`block text-xl font-extrabold tracking-tight ${inverse ? "text-white" : "text-neutral-text"}`}>
            Medisquare
          </strong>
          <span className={`block text-xs ${inverse ? "text-white/70" : "text-neutral-muted"}`}>
            Pharmacy ERP
          </span>
        </span>
      )}
    </div>
  );
}
