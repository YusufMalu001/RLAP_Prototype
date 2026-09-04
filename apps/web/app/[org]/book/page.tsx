import { WidgetRouter } from "../../../components/WidgetRouter";

export default function BookPage({ params }: { params: { org: string } }) {
  return (
    <main className="min-h-screen bg-slate-100 sm:py-6">
      <WidgetRouter orgSlug={params.org} />
    </main>
  );
}
