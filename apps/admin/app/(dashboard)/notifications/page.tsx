"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Select } from "../../../components/Field";
import { api } from "../../../lib/apiClient";
import type { NotificationChannel, SentNotificationRow } from "../../../lib/types";

const CHANNELS: NotificationChannel[] = ["SMS", "EMAIL", "WHATSAPP"];

export default function NotificationsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Loading…</p>}>
      <NotificationsPageInner />
    </Suspense>
  );
}

function NotificationsPageInner() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") ?? undefined;
  const [channel, setChannel] = useState<NotificationChannel | "">("");
  const [notifications, setNotifications] = useState<SentNotificationRow[] | null>(null);

  useEffect(() => {
    api
      .notifications({ bookingId, channel: channel || undefined })
      .then((data) => setNotifications(data.notifications));
  }, [bookingId, channel]);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Notifications Log</h1>
      <p className="mb-4 text-sm text-slate-500">
        Every SMS/email/WhatsApp send recorded by the mock notification provider.
      </p>

      <div className="mb-3 flex items-center gap-3">
        {bookingId ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
            Filtered to one booking —{" "}
            <Link href="/notifications" className="text-blue-600 hover:underline">
              clear
            </Link>
          </span>
        ) : null}
        <Select
          value={channel}
          onChange={(e) => setChannel(e.target.value as NotificationChannel | "")}
          className="w-48"
        >
          <option value="">All channels</option>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      {!notifications ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-slate-400">No notifications sent yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-2">Sent At</th>
                <th className="px-4 py-2">Booking</th>
                <th className="px-4 py-2">Channel</th>
                <th className="px-4 py-2">To</th>
                <th className="px-4 py-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id} className="border-b border-slate-100 align-top last:border-0">
                  <td className="whitespace-nowrap px-4 py-2">
                    {new Date(n.sentAt).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2">
                    <Link
                      href={`/bookings/${n.bookingId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {n.bookingCode}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{n.channel}</td>
                  <td className="whitespace-nowrap px-4 py-2">{n.to}</td>
                  <td className="px-4 py-2">
                    {n.subject ? <div className="font-medium">{n.subject}</div> : null}
                    <div className="text-slate-500">{n.body}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
