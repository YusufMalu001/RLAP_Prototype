"use client";

import { useRouter } from "next/navigation";
import { LabTestForm } from "../../../../../components/LabTestForm";
import { api } from "../../../../../lib/apiClient";

export default function NewLabTestPage() {
  const router = useRouter();

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">New Lab Test</h1>
      <LabTestForm
        submitLabel="Create Test"
        onSubmit={async (values) => {
          const { test } = await api.createLabTest(values);
          router.push(`/catalogue/lab/${test.id}`);
        }}
      />
    </div>
  );
}
