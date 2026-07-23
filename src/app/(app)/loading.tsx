export default function ApplicationLoading() {
  return (
    <div aria-busy="true" aria-label="Loading workspace" className="animate-pulse">
      <div className="h-4 w-36 rounded-full bg-brand-pale" />
      <div className="mt-3 h-10 w-full max-w-md rounded-xl bg-slate-200" />
      <div className="mt-3 h-4 w-full max-w-xl rounded-full bg-slate-100" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="h-40 rounded-2xl border border-neutral-border bg-neutral-surface p-5" key={index}>
            <div className="size-11 rounded-2xl bg-slate-100" />
            <div className="mt-5 h-3 w-24 rounded-full bg-slate-100" />
            <div className="mt-3 h-7 w-32 rounded-lg bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
