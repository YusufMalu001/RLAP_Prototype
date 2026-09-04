"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/apiClient";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    api
      .me()
      .then(() => router.replace("/dashboard"))
      .catch(() => router.replace("/login"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="p-8 text-sm text-slate-400">Loading…</div>;
}
