import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-24 text-center">
      <h1 className="text-3xl font-semibold">RLAP Booking Widget</h1>
      <p className="max-w-sm text-slate-500">
        The widget renders per-organization. For local dev against the seeded Vijaya Diagnostics
        org:
      </p>
      <div className="flex gap-3">
        <Link
          href="/vijaya-diagnostics/book"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Open Booking Widget
        </Link>
        <Link
          href="/vijaya-diagnostics/reports"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Download Reports
        </Link>
      </div>
    </main>
  );
}
