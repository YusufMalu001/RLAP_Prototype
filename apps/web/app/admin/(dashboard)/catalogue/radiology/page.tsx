"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/admin/apiClient";
import { Button } from "@/components/admin/Button";
import type { RadiologyExam } from "@/lib/admin/types";

export default function RadiologyCataloguePage() {
  const [exams, setExams] = useState<RadiologyExam[] | null>(null);

  useEffect(() => {
    api.radiologyExams().then((data) => setExams(data.exams));
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Radiology Catalogue</h1>
        <Link href="/admin/catalogue/radiology/new">
          <Button>+ New Exam</Button>
        </Link>
      </div>

      {exams === null ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : exams.length === 0 ? (
        <p className="text-sm text-slate-400">No radiology exams yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Modality</th>
                <th className="px-4 py-2">Body Part</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Safety Check</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/catalogue/radiology/${exam.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {exam.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{exam.modality}</td>
                  <td className="px-4 py-2">{exam.bodyPartCategory}</td>
                  <td className="px-4 py-2">₹{exam.price}</td>
                  <td className="px-4 py-2">{exam.requiresSafetyCheck ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
