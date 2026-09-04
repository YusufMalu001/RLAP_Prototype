"use client";

import { useRouter } from "next/navigation";
import { CentreForm } from "../../../../components/CentreForm";
import { api } from "../../../../lib/apiClient";

export default function NewCentrePage() {
  const router = useRouter();

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">New Centre</h1>
      <CentreForm
        submitLabel="Create Centre"
        onSubmit={async (values) => {
          const { centre } = await api.createCentre(values);
          router.push(`/centres/${centre.id}`);
        }}
      />
    </div>
  );
}
