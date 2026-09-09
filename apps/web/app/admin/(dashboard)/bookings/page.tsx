"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/admin/apiClient";
import { Select, TextInput } from "@/components/admin/Field";
import type { BookingListItem, BookingStatus } from "@/lib/admin/types";

const STATUSES: BookingStatus[] = ["PENDING_PAYMENT", "CONFIRMED", "COMPLETED", "CANCELLED"];

const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function BookingsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Loading…</p>}>
      <BookingsPageInner />
    </Suspense>
  );
}

function BookingsPageInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<BookingStatus | "">(
    (searchParams.get("status") as BookingStatus | null) ?? "",
  );
  const [centreId, setCentreId] = useState(searchParams.get("centreId") ?? "");
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [page, setPage] = useState(1);
  const [centres, setCentres] = useState<Array<{ id: string; name: string }>>([]);
  const [result, setResult] = useState<{
    total: number;
    page: number;
    pageSize: number;
    bookings: BookingListItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.centres().then((data) => setCentres(data.centres));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .bookings({ status: status || undefined, centreId: centreId || undefined, q: q || undefined, page })
      .then(setResult)
      .finally(() => setLoading(false));
  }, [status, centreId, q, page]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Bookings</h1>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <TextInput
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          placeholder="Search by code, patient name or mobile…"
          className="w-72"
        />
        <Select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as BookingStatus | "");
          }}
          className="w-48"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select
          value={centreId}
          onChange={(e) => {
            setPage(1);
            setCentreId(e.target.value);
          }}
          className="w-56"
        >
          <option value="">All centres</option>
          {centres.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : !result || result.bookings.length === 0 ? (
        <p className="text-sm text-slate-400">No bookings match these filters.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-2">Booking</th>
                  <th className="px-4 py-2">Patient</th>
                  <th className="px-4 py-2">Centre</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {result.bookings.map((b) => (
                  <tr key={b.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {b.bookingCode}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      {b.patientName ?? "—"} · {b.patientMobile}
                    </td>
                    <td className="px-4 py-2">{b.centre.name}</td>
                    <td className="px-4 py-2">{b.type}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[b.status]}`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">₹{b.totalAmount}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
            <span>
              {result.total} booking{result.total === 1 ? "" : "s"} total
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
