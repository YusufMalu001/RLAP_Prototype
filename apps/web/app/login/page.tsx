"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api as adminApi, ApiError as AdminApiError } from "@/lib/admin/apiClient";
import { homeForRole } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/session/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Could not sign in");
        return;
      }
      const role: "ADMIN" | "PATIENT" = data.role;

      // The role cookie above only gates routes in this app. ADMIN screens also need the API's
      // own signed session cookie (adminAuthMiddleware) — that has to be set by the browser
      // talking directly to the API's origin, so it's a second request, not proxied through here.
      if (role === "ADMIN") {
        try {
          await adminApi.login(email, password);
        } catch (err) {
          setError(
            err instanceof AdminApiError
              ? `Signed in, but the admin API rejected these credentials: ${err.message}`
              : "Signed in, but could not reach the admin API",
          );
          return;
        }
      }

      router.replace(homeForRole(role));
      router.refresh();
    } catch {
      setError("Could not reach the server — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-margin-mobile">
      <div
        aria-hidden
        className="animate-float-slow pointer-events-none absolute -top-32 -right-24 h-[26rem] w-[26rem] rounded-full bg-primary-fixed/30 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-float-slow-reverse pointer-events-none absolute -bottom-40 -left-24 h-[24rem] w-[24rem] rounded-full bg-secondary-fixed/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(22,59,72,0.06)_1px,_transparent_0)] [background-size:28px_28px]"
      />

      <div className="animate-fade-in-up relative z-10 flex w-full max-w-[420px] flex-col items-center gap-space-lg rounded-xl bg-surface-container-lowest p-card-pad-lg shadow-rlap-2">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-on-primary shadow-[0_8px_24px_rgba(22,59,72,0.25)]">
          <span className="animate-ring-pulse absolute inset-0 rounded-2xl" />
          <span className="material-symbols-outlined text-[28px]">local_hospital</span>
        </div>

        <div className="text-center">
          <h1 className="font-headline-md text-headline-md tracking-tight text-primary">
            RLAP Diagnostics
          </h1>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            Sign in to continue
          </p>
        </div>

        {error ? (
          <div className="w-full rounded-lg border border-error bg-error-container px-space-md py-space-sm font-body-md text-body-md text-on-error-container">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-md font-semibold text-primary">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="you@example.com"
              className="h-touch-target-min w-full rounded-lg bg-surface-container-low px-space-md font-body-lg text-body-lg text-on-surface outline-none placeholder:text-outline focus:bg-surface-container"
            />
          </div>
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-md font-semibold text-primary">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="h-touch-target-min w-full rounded-lg bg-surface-container-low px-space-md font-body-lg text-body-lg text-on-surface outline-none placeholder:text-outline focus:bg-surface-container"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-space-xs flex h-12 items-center justify-center gap-space-xs rounded-lg bg-secondary font-label-lg text-label-lg text-on-secondary shadow-sm transition-all hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="font-caption text-caption text-on-surface-variant">
          Patient demo: patient@gmail.com / patient@123 · Admin demo: admin@gmail.com / admin@123
        </p>
      </div>
    </main>
  );
}
