"use client";

import { useEffect, useRef } from "react";

export function AutoSubmit({ debounceMs = 400 }: { debounceMs?: number }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;

    let timer: NodeJS.Timeout;
    const onChange = () => {
      clearTimeout(timer);
      timer = setTimeout(() => form.requestSubmit(), debounceMs);
    };

    form.addEventListener("input", onChange);
    form.addEventListener("change", onChange);

    return () => {
      form.removeEventListener("input", onChange);
      form.removeEventListener("change", onChange);
      clearTimeout(timer);
    };
  }, [debounceMs]);

  return <input type="hidden" ref={ref} />;
}
