import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { setRecoveryReady } from "@/lib/bible";
import { getBibleAvailability } from "@/lib/bible-availability";

export const Route = createFileRoute("/")({
  // Asked once when the page loads, so the right edition is read from the
  // first paint instead of switching after.
  loader: () => getBibleAvailability(),
  component: Home,
});

function Home() {
  const { recovery } = Route.useLoaderData();
  // A fixed setting for the whole visit; the server computed the same value.
  setRecoveryReady(recovery);
  return <AppShell />;
}
