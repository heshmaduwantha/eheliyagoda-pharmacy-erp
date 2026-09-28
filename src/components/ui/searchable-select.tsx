"use client";

import { useState, useRef, useEffect, useMemo, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search } from "lucide-react";

export type SearchableSelectOption = {
  value: string;
  label: string;
  subLabel?: string;
  keywords?: string[];
  raw?: unknown;
};

export type SearchableSelectAsyncItem = {
  id?: string;
  value?: string;
  name?: string;
  label?: string;
  subLabel?: string;
  genericName?: string;
  strength?: string;
  barcodes?: string[];
  [key: string]: unknown;
};

type SearchableSelectProps = {
  options: SearchableSelectOption[];
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  onChange?: (val: string) => void;
  asyncSearchUrl?: string;
  onAsyncLoaded?: (data: SearchableSelectAsyncItem[]) => void;
};

export function SearchableSelect({
  options: initialOptions,
  name,
  defaultValue = "",
  placeholder = "Select an option...",
  required = false,
  disabled = false,
  id,
  onChange,
  asyncSearchUrl,
  onAsyncLoaded,
  maxResults = 30,
}: SearchableSelectProps & { maxResults?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const [asyncOptions, setAsyncOptions] = useState<SearchableSelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);

  // Live database search when asyncSearchUrl is provided
  useEffect(() => {
    if (!isOpen || !asyncSearchUrl) return;
    const trimmed = search.trim();
    if (!trimmed) {
      setAsyncOptions([]);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${asyncSearchUrl}?q=${encodeURIComponent(trimmed)}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        if (!isCancelled && Array.isArray(data)) {
          if (onAsyncLoaded) onAsyncLoaded(data);
          const mapped: SearchableSelectOption[] = data.map((item: SearchableSelectAsyncItem) => ({
            value: String(item.id ?? item.value ?? ""),
            label: String(item.name ?? item.label ?? ""),
            subLabel: item.subLabel || [item.genericName, item.strength, item.barcodes?.length ? `Barcode: ${item.barcodes.join(", ")}` : null].filter(Boolean).join(" • "),
            keywords: [item.name, item.genericName, item.strength, ...(item.barcodes || [])].filter((v): v is string => Boolean(v)),
            raw: item,
          }));
          setAsyncOptions(mapped);
        }
      } catch {
        // Silently fallback to local filtering on error
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [search, isOpen, asyncSearchUrl]);

  const updatePosition = () => {
    if (containerRef.current) {
      const bounds = containerRef.current.getBoundingClientRect();
      setRect({
        top: bounds.bottom,
        left: bounds.left,
        width: bounds.width,
      });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedValue(defaultValue);
  }, [defaultValue]);

  const combinedOptions = useMemo(() => {
    if (asyncOptions.length === 0) return initialOptions;
    const map = new Map<string, SearchableSelectOption>();
    for (const opt of initialOptions) map.set(opt.value, opt);
    for (const opt of asyncOptions) map.set(opt.value, opt);
    return Array.from(map.values());
  }, [initialOptions, asyncOptions]);

  const selectedOption = useMemo(
    () => combinedOptions.find((opt) => opt.value === selectedValue),
    [combinedOptions, selectedValue]
  );

  const allMatches = useMemo(() => {
    const trimmed = search.trim();
    if (!trimmed) return combinedOptions;
    if (asyncOptions.length > 0) return asyncOptions;
    const lowerSearch = trimmed.toLowerCase();
    return combinedOptions.filter((opt) => {
      if (opt.label.toLowerCase().startsWith(lowerSearch)) return true;
      if (opt.subLabel && opt.subLabel.toLowerCase().startsWith(lowerSearch)) return true;
      if (opt.keywords && opt.keywords.some((k) => k.toLowerCase().startsWith(lowerSearch))) return true;
      return false;
    });
  }, [combinedOptions, asyncOptions, search]);

  const filteredOptions = useMemo(() => {
    return allMatches.slice(0, maxResults);
  }, [allMatches, maxResults]);

  const handleSelect = (val: string) => {
    setSelectedValue(val);
    setIsOpen(false);
    if (onChange) onChange(val);
  };

  const menu = isOpen && rect ? (
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: rect.top + 4,
        left: rect.left,
        width: Math.max(rect.width, 300),
        zIndex: 9999,
      }}
      className="max-h-64 overflow-hidden flex flex-col rounded-lg border border-neutral-border bg-neutral-surface shadow-xl"
    >
      <div className="bg-neutral-bg px-3 py-2 border-b border-neutral-border flex items-center gap-2">
        <Search className="size-4 text-neutral-muted shrink-0" />
        <input
          ref={searchInputRef}
          type="text"
          className="w-full outline-none text-sm bg-transparent placeholder:text-neutral-muted"
          placeholder="Type letters or numbers to search database..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && filteredOptions.length > 0) {
              e.preventDefault();
              handleSelect(filteredOptions[0].value);
            }
          }}
        />
        {isLoading && (
          <span className="text-[11px] text-brand-default animate-pulse font-medium shrink-0">
            Searching…
          </span>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-1">
        {filteredOptions.length === 0 ? (
          <div className="py-3 text-center text-sm text-neutral-muted">
            {isLoading ? "Searching database..." : "No results found."}
          </div>
        ) : (
          filteredOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={`w-full flex items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors text-left ${
                selectedValue === opt.value
                  ? "bg-brand-pale text-brand-default font-semibold"
                  : "text-neutral-text hover:bg-slate-100"
              }`}
            >
              <div className="min-w-0 flex-1 mr-2">
                <p className="truncate text-xs font-semibold">{opt.label}</p>
                {opt.subLabel && (
                  <p className="truncate text-[11px] text-neutral-muted font-normal mt-0.5">
                    {opt.subLabel}
                  </p>
                )}
              </div>
              {selectedValue === opt.value && <Check className="size-4 shrink-0 text-brand-default" />}
            </button>
          ))
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="relative w-full" ref={containerRef}>
      <input type="hidden" name={name} value={selectedValue} required={required} />
      
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-lg border border-neutral-border bg-neutral-surface px-3 py-2 text-sm text-neutral-text shadow-sm outline-none transition focus:border-brand-default focus:ring-1 focus:ring-brand-default/50 disabled:opacity-60"
      >
        <span className={`truncate ${!selectedOption ? "text-neutral-muted" : ""}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`size-4 shrink-0 text-neutral-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(menu, document.body)}
    </div>
  );
}
