"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  return (
    <div className="relative w-full" ref={containerRef}>
      <input type="hidden" name={name} value={selectedValue} required={required} />
      
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-60"
      >
        <span className={`truncate ${!selectedOption ? "text-slate-400" : ""}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`size-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden flex flex-col rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex items-center gap-2">
            <Search className="size-4 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              className="w-full outline-none text-sm bg-transparent placeholder:text-slate-400"
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
              <div className="py-3 text-center text-sm text-slate-500">
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
                      ? "bg-teal-50 text-teal-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {selectedValue === opt.value && <Check className="size-4 shrink-0 text-teal-600" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
