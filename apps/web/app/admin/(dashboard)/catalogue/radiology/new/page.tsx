"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/admin/apiClient";
import { RadiologyExamForm } from "@/components/admin/RadiologyExamForm";

export default function NewRadiologyExamPage() {
  const router = useRouter();

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">New Radiology Exam</h1>
      <RadiologyExamForm
        submitLabel="Create Exam"
        onSubmit={async (values) => {
          const { exam } = await api.createRadiologyExam(values);
          router.push(`/admin/catalogue/radiology/${exam.id}`);
        }}
      />
    </div>
  );
}
