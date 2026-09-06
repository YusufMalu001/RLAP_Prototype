import { AppShell } from "../../../components/AppHeader";
import { WidgetRouter } from "../../../components/WidgetRouter";

export default function BookPage({ params }: { params: { org: string } }) {
  return (
    <AppShell>
      <WidgetRouter orgSlug={params.org} />
    </AppShell>
  );
}
