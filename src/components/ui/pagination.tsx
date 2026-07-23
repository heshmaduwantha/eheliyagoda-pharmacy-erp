import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  queryParams: Record<string, string | undefined>;
};

export function Pagination({ currentPage, totalPages, baseUrl, queryParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  const createUrl = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    params.set("page", page.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between border-t border-neutral-border bg-neutral-bg/50 px-5 py-3">
      <p className="text-xs text-neutral-muted">
        Showing page <span className="font-semibold text-neutral-text">{currentPage}</span> of <span className="font-semibold text-neutral-text">{totalPages}</span>
      </p>
      
      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link
            href={createUrl(currentPage - 1)}
            className="inline-flex items-center gap-1 rounded-md border border-neutral-border bg-neutral-surface px-3 py-1.5 text-xs font-semibold text-neutral-text transition hover:bg-neutral-bg"
          >
            <ChevronLeft className="size-3.5" /> Previous
          </Link>
        ) : (
          <button disabled className="inline-flex items-center gap-1 rounded-md border border-neutral-border bg-neutral-bg px-3 py-1.5 text-xs font-semibold text-neutral-muted">
            <ChevronLeft className="size-3.5" /> Previous
          </button>
        )}

        {currentPage < totalPages ? (
          <Link
            href={createUrl(currentPage + 1)}
            className="inline-flex items-center gap-1 rounded-md border border-neutral-border bg-neutral-surface px-3 py-1.5 text-xs font-semibold text-neutral-text transition hover:bg-neutral-bg"
          >
            Next <ChevronRight className="size-3.5" />
          </Link>
        ) : (
          <button disabled className="inline-flex items-center gap-1 rounded-md border border-neutral-border bg-neutral-bg px-3 py-1.5 text-xs font-semibold text-neutral-muted">
            Next <ChevronRight className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
