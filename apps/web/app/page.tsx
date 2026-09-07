import Link from "next/link";

const PATHWAYS = [
  {
    icon: "monitor_heart",
    title: "Radiology",
    copy: "Scans, imaging, and doppler studies across every modality.",
  },
  {
    icon: "biotech",
    title: "Laboratory",
    copy: "Pathology, biochemistry, and curated health packages.",
  },
  {
    icon: "description",
    title: "Reports",
    copy: "OTP-verified access to every completed diagnostic report.",
  },
];

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center overflow-hidden bg-background">
      {/* Ambient decorative field */}
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

      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-margin-mobile py-space-2xl lg:px-margin-desktop">
        {/* Brand mark */}
        <div
          className="animate-fade-in-up mb-space-lg flex flex-col items-center gap-space-sm"
          style={{ animationDelay: "0ms" }}
        >
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container text-on-primary shadow-[0_8px_24px_rgba(22,59,72,0.25)]">
            <span className="animate-ring-pulse absolute inset-0 rounded-2xl" />
            <span className="material-symbols-outlined text-[32px]">local_hospital</span>
          </div>
          <div className="flex items-center gap-space-2xs">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
            <span className="font-caption text-caption uppercase tracking-[0.2em] text-on-surface-variant">
              Diagnostics, Reimagined
            </span>
          </div>
        </div>

        <h1
          className="animate-fade-in-up max-w-2xl text-center font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-headline-lg"
          style={{ animationDelay: "80ms" }}
        >
          RLAP Booking Widget
        </h1>
        <p
          className="animate-fade-in-up mt-space-sm max-w-lg text-center font-body-lg text-body-lg text-on-surface-variant"
          style={{ animationDelay: "160ms" }}
        >
          A calm, precise path from prescription to appointment — rendered per organization. This
          local build points at the seeded Vijaya Diagnostics org.
        </p>

        <div
          className="animate-fade-in-up mt-space-xl flex flex-col items-center gap-space-md sm:flex-row"
          style={{ animationDelay: "240ms" }}
        >
          <Link
            href="/vijaya-diagnostics/book"
            className="group flex h-14 min-w-[240px] items-center justify-center gap-space-xs rounded-xl bg-secondary px-space-xl font-label-lg text-label-lg text-on-secondary shadow-[0_10px_28px_rgba(154,68,45,0.28)] transition-all hover:-translate-y-0.5 hover:bg-secondary/90 active:translate-y-0"
          >
            <span>Open Booking Widget</span>
            <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">
              arrow_forward
            </span>
          </Link>
          <Link
            href="/vijaya-diagnostics/reports"
            className="flex h-14 min-w-[200px] items-center justify-center gap-space-xs rounded-xl border-2 border-outline-variant bg-surface-container-lowest px-space-xl font-label-lg text-label-lg text-primary transition-all hover:-translate-y-0.5 hover:border-primary-container active:translate-y-0"
          >
            <span className="material-symbols-outlined text-[20px]">description</span>
            <span>Download Reports</span>
          </Link>
        </div>

        {/* Pathway strip */}
        <div className="mt-space-2xl grid w-full max-w-3xl grid-cols-1 gap-space-md sm:grid-cols-3">
          {PATHWAYS.map((p, i) => (
            <div
              key={p.title}
              className="animate-fade-in-up group flex flex-col items-center gap-space-xs rounded-xl bg-surface-container-lowest p-space-lg text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              style={{ animationDelay: `${320 + i * 100}ms` }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-container-low text-primary transition-colors group-hover:bg-primary-container group-hover:text-on-primary">
                <span className="material-symbols-outlined text-[22px]">{p.icon}</span>
              </div>
              <h2 className="font-title-md text-title-md font-semibold text-primary">{p.title}</h2>
              <p className="font-caption text-caption text-on-surface-variant">{p.copy}</p>
            </div>
          ))}
        </div>
      </div>

      <footer
        className="animate-fade-in-up relative z-10 flex items-center gap-space-xs pb-space-xl font-caption text-caption text-on-surface-variant"
        style={{ animationDelay: "620ms" }}
      >
        <span className="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
        <span>ISO 15189 Certified · Private, encrypted patient records</span>
      </footer>
    </main>
  );
}
