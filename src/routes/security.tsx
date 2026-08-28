import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/anoneurx/AppShell";
import { SecurityPanel } from "@/components/anoneurx/SecurityPanel";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security — Anoneurx Authenticcator" },
      {
        name: "description",
        content: "Manage vault encryption status, biometric lock preferences, and auto-lock options.",
      },
    ],
  }),
  component: SecurityScreen,
});

function SecurityScreen() {
  return (
    <AppShell>
      <SecurityPanel />
    </AppShell>
  );
}
