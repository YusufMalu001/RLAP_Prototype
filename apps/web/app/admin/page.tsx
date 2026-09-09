"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/admin/apiClient";

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    api
      .me()
      .then(() => router.replace("/admin/dashboard"))
      .catch(() => router.replace("/login"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="p-8 text-sm text-slate-400">Loading…</div>;
}
