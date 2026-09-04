"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Select } from "../../../components/Field";
import { api } from "../../../lib/apiClient";
import type { BookingListItem, BookingStatus } from "../../../lib/types";

const STATUSES: BookingStatus[] = ["PENDING_PAYMENT", "CONFIRMED", "COMPLETED", "CANCELLED"];

export default function DashboardPage() {
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [centres, setCentres] = useState<Array<{ id: string; name: string }>>([]);
  const [centreId, setCentreId] = useState("");
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .dashboard({ centreId: centreId || undefined, status: status || undefined })
      .then((data) => {
        setTodayCount(data.todayBookingsCount);
        setBookings(data.upcomingBookings);
        setCentres(data.centres);
      })
      .finally(() => setLoading(false));
  }, [centreId, status]);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Dashboard</h1>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Today&apos;s Bookings
        </div>
        <div className="mt-1 text-3xl font-bold text-slate-900">{todayCount ?? "—"}</div>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-700">Upcoming Bookings</h2>
        <Select value={centreId} onChange={(e) => setCentreId(e.target.value)} className="w-48">
          <option value="">All centres</option>
          {centres.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as BookingStatus | "")}
          className="w-48"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-slate-400">No upcoming bookings match these filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-2">Booking</th>
                <th className="px-4 py-2">Patient</th>
                <th className="px-4 py-2">Centre</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">
                    <Link
                      href={`/bookings/${b.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {b.bookingCode}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    {b.patientName ?? "—"} · {b.patientMobile}
                  </td>
                  <td className="px-4 py-2">{b.centre.name}</td>
                  <td className="px-4 py-2">{b.status}</td>
                  <td className="px-4 py-2">₹{b.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
