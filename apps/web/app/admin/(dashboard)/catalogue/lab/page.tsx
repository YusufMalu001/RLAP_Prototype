"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/admin/apiClient";
import { Button } from "@/components/admin/Button";
import type { LabTest } from "@/lib/admin/types";

export default function LabCataloguePage() {
  const [tests, setTests] = useState<LabTest[] | null>(null);

  useEffect(() => {
    api.labTests().then((data) => setTests(data.tests));
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Lab Catalogue</h1>
        <Link href="/admin/catalogue/lab/new">
          <Button>+ New Test</Button>
        </Link>
      </div>

      {tests === null ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : tests.length === 0 ? (
        <p className="text-sm text-slate-400">No lab tests yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Package</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Home Collection</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/catalogue/lab/${test.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {test.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{test.category}</td>
                  <td className="px-4 py-2">{test.isPackage ? "Yes" : "No"}</td>
                  <td className="px-4 py-2">₹{test.price}</td>
                  <td className="px-4 py-2">{test.homeCollectionEligible ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
