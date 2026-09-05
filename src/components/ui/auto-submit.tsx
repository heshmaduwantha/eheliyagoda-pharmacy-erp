"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

export function AutoSubmit({ debounceMs = 400 }: { debounceMs?: number }) {
  const ref = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;

    let timer: ReturnType<typeof setTimeout>;
    const onSubmit = (event: SubmitEvent) => {
      // Enhance only local GET filters; mutation forms retain native behavior.
      if (form.method.toLowerCase() !== "get") return;
      const url = new URL(form.action || window.location.href);
      if (url.origin !== window.location.origin) return;
      event.preventDefault();
      clearTimeout(timer);
      url.search = "";
      for (const [key, value] of new FormData(form)) {
        if (typeof value === "string" && value !== "" && key !== "page") url.searchParams.append(key, value);
      }
      startTransition(() => router.replace(`${url.pathname}${url.search}`, { scroll: false }));
    };
    const onChange = (event: Event) => {
      clearTimeout(timer);
      if (event.target instanceof HTMLSelectElement) {
        // Selects emit input followed by change; submit once, immediately.
        if (event.type === "change") form.requestSubmit();
        return;
      }
      timer = setTimeout(() => form.requestSubmit(), debounceMs);
    };

    form.addEventListener("submit", onSubmit);
    form.addEventListener("input", onChange);
    form.addEventListener("change", onChange);

    return () => {
      form.removeEventListener("submit", onSubmit);
      form.removeEventListener("input", onChange);
      form.removeEventListener("change", onChange);
      clearTimeout(timer);
    };
  }, [debounceMs, router]);

  return <>
    <input type="hidden" ref={ref} />
    {pending && <span role="status" className="text-xs text-neutral-muted">Updating…</span>}
  </>;
}
