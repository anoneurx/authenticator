import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/anoneurx/AppShell";
import { SettingsPanel } from "@/components/anoneurx/SettingsPanel";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Anoneurx Authenticcator" },
      {
        name: "description",
        content: "Application settings, appearance options, system information, and privacy guarantees.",
      },
    ],
  }),
  component: SettingsScreen,
});

function SettingsScreen() {
  return (
    <AppShell>
      <SettingsPanel />
    </AppShell>
  );
}
