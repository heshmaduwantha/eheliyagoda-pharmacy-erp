"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
  const pathname = usePathname();
  
  if (!pathname || pathname === "/dashboard") return null;

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    // Format the segment to be more readable (e.g. capitalize, replace dashes with spaces)
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    const isLast = index === segments.length - 1;
    
    return { href, label, isLast };
  });

  return (
    <nav className="mb-1 flex items-center text-sm font-bold text-teal-700" aria-label="Breadcrumb">
      <Link href="/dashboard" className="flex items-center hover:text-teal-800 transition">
        <Home className="size-4" />
      </Link>
      {breadcrumbs.map((crumb) => (
        <div key={crumb.href} className="flex items-center">
          <ChevronRight className="size-4 mx-1.5 text-teal-600/50 shrink-0" />
          {crumb.isLast ? (
            <span aria-current="page">
              {crumb.label}
            </span>
          ) : (
            <Link href={crumb.href} className="hover:text-teal-800 transition">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
