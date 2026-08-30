import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileBottomNav } from "./MobileBottomNav";
import { AddAccountModal } from "./AddAccountModal";
import { LockScreen } from "./LockScreen";
import { SetupWizard } from "./SetupWizard";
import { useVault } from "@/store/vault";
import { enableSystemNotifications } from "@/lib/notify";
import { BackupPanel } from "./BackupPanel";

export function AppShell({ children }: { children: ReactNode }) {
  const { locked, setupComplete, ready } = useVault();
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [showBackupImport, setShowBackupImport] = useState(false);

  // ── Ask for notification permission right after the app is installed ──
  useEffect(() => {
    function onInstalled() {
      void enableSystemNotifications();
    }
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  // ── Close the backup-import overlay on hardware back / Escape ──
  useEffect(() => {
    if (!showBackupImport) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowBackupImport(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showBackupImport]);

  // ── First-run: profile not yet created ────────────────────────────────────
  if (ready && !setupComplete) {
    return <SetupWizard />;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex flex-1 flex-col min-w-0 pb-16 md:pb-0">
        <TopBar onAddAccount={() => setAddAccountOpen(true)} />

        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onAddAccount={() => setAddAccountOpen(true)} />

      {/* Global Add Account Modal */}
      <AddAccountModal open={addAccountOpen} onOpenChange={setAddAccountOpen} />

      {/* Backup Import (triggered from LockScreen restore) */}
        {showBackupImport && !locked && (
          <div
            data-custom-overlay="open"
            className="fixed inset-0 z-50 bg-background animate-in fade-in duration-200"
          >
          <div className="max-w-4xl mx-auto p-4 sm:p-6">
            <button
              type="button"
              onClick={() => setShowBackupImport(false)}
              className="mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Back to app
            </button>
            <BackupPanel />
          </div>
        </div>
      )}

      {/* Lock Screen Overlay */}
      {locked && <LockScreen />}
    </div>
  );
}
