"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/admin/apiClient";
import { Button } from "@/components/admin/Button";
import type { BookingDetail, BookingStatus } from "@/lib/admin/types";

const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  function reload() {
    api
      .booking(params.id)
      .then(setBooking)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load booking"));
  }

  useEffect(reload, [params.id]);

  async function handleComplete() {
    setCompleting(true);
    setError(null);
    try {
      await api.completeBooking(params.id);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not mark as completed");
    } finally {
      setCompleting(false);
    }
  }

  if (error && !booking) {
    return <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;
  }
  if (!booking) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{booking.bookingCode}</h1>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[booking.status]}`}
          >
            {booking.status}
          </span>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/notifications?bookingId=${booking.id}`}>
            <Button variant="secondary">View Notifications</Button>
          </Link>
          {booking.status === "CONFIRMED" ? (
            <Button onClick={handleComplete} disabled={completing}>
              {completing ? "Marking…" : "Mark as Completed"}
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Patient</h2>
          <p className="text-sm text-slate-900">{booking.patient.name ?? "—"}</p>
          <p className="text-sm text-slate-500">{booking.patient.mobileNumber}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Centre</h2>
          <p className="text-sm text-slate-900">{booking.centre.name}</p>
          <p className="text-sm text-slate-500">{booking.centre.address}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Payment</h2>
          <p className="text-sm text-slate-900">
            {booking.paymentMethod} · ₹{booking.totalAmount}
          </p>
          {booking.collectionMode ? (
            <p className="text-sm text-slate-500">{booking.collectionMode}</p>
          ) : null}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Created</h2>
          <p className="text-sm text-slate-900">{new Date(booking.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold text-slate-700">Schedule</h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {booking.schedule.map((s, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2">{s.type}</td>
                <td className="px-4 py-2">{s.date}</td>
                <td className="px-4 py-2">
                  {s.startTime}–{s.endTime}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold text-slate-700">Line Items</h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Source</th>
              <th className="px-4 py-2">Preparation</th>
            </tr>
          </thead>
          <tbody>
            {booking.lineItems.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2">{item.name}</td>
                <td className="px-4 py-2">{item.itemType}</td>
                <td className="px-4 py-2">₹{item.price}</td>
                <td className="px-4 py-2">
                  {item.source}
                  {item.ocrConfidence ? ` (${item.ocrConfidence})` : ""}
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {item.preparationInstructions ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {booking.safetyCheck.length > 0 ? (
        <>
          <h2 className="mb-2 mt-6 text-sm font-semibold text-slate-700">Safety Check</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-2">Question</th>
                  <th className="px-4 py-2">Answer</th>
                  <th className="px-4 py-2">Flagged</th>
                </tr>
              </thead>
              <tbody>
                {booking.safetyCheck.map((s, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2">{s.questionKey}</td>
                    <td className="px-4 py-2">{s.answer}</td>
                    <td className="px-4 py-2">{s.flagged ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
