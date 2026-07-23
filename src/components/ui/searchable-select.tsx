"use client";

import { useState, useRef, useEffect, useMemo, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search } from "lucide-react";

export type SearchableSelectOption = {
  value: string;
  label: string;
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
};

export function SearchableSelect({
  options,
  name,
  defaultValue = "",
  placeholder = "Select an option...",
  required = false,
  disabled = false,
  id,
  onChange,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);

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

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === selectedValue),
    [options, selectedValue]
  );

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lowerSearch = search.toLowerCase();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(lowerSearch)
    );
  }, [options, search]);

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
        width: rect.width,
        zIndex: 9999,
      }}
      className="max-h-60 overflow-hidden flex flex-col rounded-lg border border-neutral-border bg-neutral-surface shadow-xl"
    >
      <div className="bg-neutral-bg px-3 py-2 border-b border-neutral-border flex items-center gap-2">
        <Search className="size-4 text-neutral-muted shrink-0" />
        <input
          ref={searchInputRef}
          type="text"
          className="w-full outline-none text-sm bg-transparent placeholder:text-neutral-muted"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && filteredOptions.length > 0) {
              e.preventDefault();
              handleSelect(filteredOptions[0].value);
            }
          }}
        />
      </div>
      
      <div className="flex-1 overflow-y-auto p-1">
        {filteredOptions.length === 0 ? (
          <div className="py-3 text-center text-sm text-neutral-muted">
            No results found.
          </div>
        ) : (
          filteredOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors text-left ${
                selectedValue === opt.value
                  ? "bg-brand-pale text-brand-default font-semibold"
                  : "text-neutral-text hover:bg-slate-100"
              }`}
            >
              <span className="truncate">{opt.label}</span>
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
