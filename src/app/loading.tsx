export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand" />
        <span className="text-sm text-subtle">Loading…</span>
      </div>
    </div>
  );
}
