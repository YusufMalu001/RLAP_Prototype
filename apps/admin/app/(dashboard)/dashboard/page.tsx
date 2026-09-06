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

  const STATUS_STYLES: Record<BookingStatus, string> = {
    PENDING_PAYMENT: "bg-rlap-tertiary-light/10 text-rlap-tertiary-light",
    CONFIRMED: "bg-rlap-primary-container/10 text-rlap-primary-container",
    COMPLETED: "bg-rlap-success/10 text-rlap-success",
    CANCELLED: "bg-rlap-error/10 text-rlap-error",
  };

  return (
    <div>
      <h1 className="mb-6 text-headline-md font-bold text-rlap-on-surface">Operations Dashboard</h1>

      <div className="mb-8 rounded-lg border border-rlap-outline-variant bg-rlap-surface-bright p-5 shadow-rlap-1">
        <div className="text-label-md font-semibold uppercase tracking-wide text-rlap-on-surface-variant">
          Today&apos;s Bookings
        </div>
        <div className="mt-1 text-display-lg text-rlap-primary-container">{todayCount ?? "—"}</div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-title-md font-semibold text-rlap-on-surface">Bookings Registry</h2>
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
        <p className="text-body-md text-rlap-on-surface-variant">Loading…</p>
      ) : bookings.length === 0 ? (
        <p className="text-body-md text-rlap-on-surface-variant">
          No upcoming bookings match these filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-rlap-outline-variant bg-rlap-surface-bright shadow-rlap-1">
          <table className="w-full text-left text-body-md">
            <thead className="border-b border-rlap-outline-variant text-label-md uppercase text-rlap-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Centre</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-rlap-outline-variant last:border-0 hover:bg-rlap-surface-container-low"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/bookings/${b.id}`}
                      className="font-semibold text-rlap-primary-container hover:underline"
                    >
                      {b.bookingCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-rlap-on-surface">
                    {b.patientName ?? "—"} · {b.patientMobile}
                  </td>
                  <td className="px-4 py-3 text-rlap-on-surface">{b.centre.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-caption font-semibold ${STATUS_STYLES[b.status]}`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-rlap-on-surface">₹{b.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
