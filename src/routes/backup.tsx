import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/anoneurx/AppShell";
import { BackupPanel } from "@/components/anoneurx/BackupPanel";

export const Route = createFileRoute("/backup")({
  head: () => ({
    meta: [
      { title: "Backup Vault — Anoneurx Authenticcator" },
      {
        name: "description",
        content: "Export or restore encrypted backups of your TOTP accounts completely offline.",
      },
    ],
  }),
  component: BackupScreen,
});

function BackupScreen() {
  return (
    <AppShell>
      <BackupPanel />
    </AppShell>
  );
}
