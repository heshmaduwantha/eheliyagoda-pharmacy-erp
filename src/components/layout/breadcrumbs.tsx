"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

type BreadcrumbContextType = {
  labels: Record<string, string>;
  setLabel: (key: string, label: string) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextType>({
  labels: {},
  setLabel: () => {},
});

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>({});

  const setLabel = useCallback((key: string, label: string) => {
    setLabels((prev) => {
      if (prev[key] === label) return prev;
      return { ...prev, [key]: label };
    });
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ labels, setLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function SetBreadcrumb({ segment, label }: { segment: string; label: string }) {
  const { setLabel } = useContext(BreadcrumbContext);

  useEffect(() => {
    if (segment && label) {
      setLabel(segment, label);
    }
  }, [segment, label, setLabel]);

  return null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getFallbackLabelForSegment(segment: string, parentSegment: string | undefined): string {
  const isUuid = UUID_REGEX.test(segment);
  if (isUuid) {
    switch (parentSegment?.toLowerCase()) {
      case "roles":
        return "Role Details";
      case "users":
        return "User Details";
      case "products":
        return "Product Details";
      case "grn":
        return "GRN Details";
      case "suppliers":
        return "Supplier Details";
      case "prescriptions":
        return "Prescription Details";
      case "sales":
        return "Sale Details";
      default:
        return "Details";
    }
  }

  // Format standard segments (e.g., 'grn' -> 'GRN', 'pos' -> 'POS', 'admin' -> 'Admin')
  if (segment.toLowerCase() === "grn") return "GRN";
  if (segment.toLowerCase() === "pos") return "POS";
  if (segment.toLowerCase() === "uat") return "UAT";

  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const { labels } = useContext(BreadcrumbContext);

  if (!pathname || pathname === "/dashboard") return null;

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const prevSegment = index > 0 ? segments[index - 1] : undefined;

    const label = labels[segment] || getFallbackLabelForSegment(segment, prevSegment);
    const isLast = index === segments.length - 1;

    return { href, label, isLast };
  });

  return (
    <nav className="mb-3 mt-4 flex items-center text-sm font-bold text-brand-default" aria-label="Breadcrumb">
      <Link href="/dashboard" className="flex items-center hover:text-brand-hover transition">
        <Home className="size-4" />
      </Link>
      {breadcrumbs.map((crumb, idx) => (
        <div key={`${crumb.href}-${idx}`} className="flex items-center">
          <ChevronRight className="size-4 mx-1.5 text-brand-default/50 shrink-0" />
          {crumb.isLast ? (
            <span aria-current="page" className="truncate max-w-xs sm:max-w-md">
              {crumb.label}
            </span>
          ) : (
            <Link href={crumb.href} className="hover:text-brand-hover transition truncate max-w-xs sm:max-w-md">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
