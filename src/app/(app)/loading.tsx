export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="h-7 w-40 rounded bg-muted" />
      <div className="mt-2 h-4 w-80 max-w-full rounded bg-muted/70" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-24 rounded-xl border bg-muted/30" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="h-72 rounded-xl border bg-muted/30 lg:col-span-2" />
        <div className="h-72 rounded-xl border bg-muted/30" />
      </div>
    </div>
  );
}
