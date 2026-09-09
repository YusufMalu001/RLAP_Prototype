"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/admin/apiClient";
import { Button } from "@/components/admin/Button";
import type { Centre } from "@/lib/admin/types";

export default function CentresPage() {
  const [centres, setCentres] = useState<Centre[] | null>(null);

  useEffect(() => {
    api.centres().then((data) => setCentres(data.centres));
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Centres</h1>
        <Link href="/admin/centres/new">
          <Button>+ New Centre</Button>
        </Link>
      </div>

      {centres === null ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : centres.length === 0 ? (
        <p className="text-sm text-slate-400">No centres yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">City</th>
                <th className="px-4 py-2">Area</th>
                <th className="px-4 py-2">Radiology</th>
                <th className="px-4 py-2">Lab</th>
              </tr>
            </thead>
            <tbody>
              {centres.map((centre) => (
                <tr key={centre.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/centres/${centre.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {centre.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{centre.city}</td>
                  <td className="px-4 py-2">{centre.area}</td>
                  <td className="px-4 py-2">{centre.offersRadiology ? "Yes" : "No"}</td>
                  <td className="px-4 py-2">{centre.offersLab ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
