"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/admin/apiClient";
import { CentreForm } from "@/components/admin/CentreForm";

export default function NewCentrePage() {
  const router = useRouter();

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">New Centre</h1>
      <CentreForm
        submitLabel="Create Centre"
        onSubmit={async (values) => {
          const { centre } = await api.createCentre(values);
          router.push(`/admin/centres/${centre.id}`);
        }}
      />
    </div>
  );
}
