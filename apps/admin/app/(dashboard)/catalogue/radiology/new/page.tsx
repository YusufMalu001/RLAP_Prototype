"use client";

import { useRouter } from "next/navigation";
import { RadiologyExamForm } from "../../../../../components/RadiologyExamForm";
import { api } from "../../../../../lib/apiClient";

export default function NewRadiologyExamPage() {
  const router = useRouter();

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">New Radiology Exam</h1>
      <RadiologyExamForm
        submitLabel="Create Exam"
        onSubmit={async (values) => {
          const { exam } = await api.createRadiologyExam(values);
          router.push(`/catalogue/radiology/${exam.id}`);
        }}
      />
    </div>
  );
}
