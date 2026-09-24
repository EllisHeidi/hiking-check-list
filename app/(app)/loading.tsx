export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-10" aria-busy="true" aria-label="Loading">
      <div className="h-3 w-32 animate-pulse bg-ink/10" />
      <div className="mt-4 h-16 w-2/3 max-w-lg animate-pulse bg-ink/10" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-sm bg-ink/[0.07]" />
        ))}
      </div>
    </div>
  );
}
