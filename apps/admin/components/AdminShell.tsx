"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../lib/apiClient";
import type { AdminSelf } from "../lib/types";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/catalogue/radiology", label: "Radiology Catalogue" },
  { href: "/catalogue/lab", label: "Lab Catalogue" },
  { href: "/centres", label: "Centres" },
  { href: "/bookings", label: "Bookings" },
  { href: "/notifications", label: "Notifications" },
  { href: "/settings", label: "Settings" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminSelf | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    api
      .me()
      .then(setAdmin)
      .catch(() => router.replace("/login"))
      .finally(() => setChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked || !admin) {
    return <div className="p-8 text-sm text-slate-400">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white px-3 py-6">
        <div className="mb-6 px-2 text-sm font-bold text-slate-900">RLAP Admin</div>
        <nav className="space-y-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                  active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="text-xs text-slate-500">Signed in as {admin.name}</div>
          <button
            onClick={() => void api.logout().finally(() => router.replace("/login"))}
            className="text-xs font-medium text-slate-500 underline hover:text-slate-700"
          >
            Log out
          </button>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
