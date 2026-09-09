"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/admin/apiClient";
import { LabTestForm } from "@/components/admin/LabTestForm";

export default function NewLabTestPage() {
  const router = useRouter();

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">New Lab Test</h1>
      <LabTestForm
        submitLabel="Create Test"
        onSubmit={async (values) => {
          const { test } = await api.createLabTest(values);
          router.push(`/admin/catalogue/lab/${test.id}`);
        }}
      />
    </div>
  );
}
