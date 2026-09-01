import { useEffect, useState, lazy, Suspense, type ReactNode } from "react";
import { TopBar } from "./TopBar";
import { MobileBottomNav } from "./MobileBottomNav";
import { LockScreen } from "./LockScreen";
import { useVault } from "@/store/vault";
import { enableSystemNotifications } from "@/lib/notify";
import { Capacitor } from "@capacitor/core";

const AddAccountModal = lazy(() => import("./AddAccountModal").then(m => ({ default: m.AddAccountModal })));
const SetupWizard = lazy(() => import("./SetupWizard").then(m => ({ default: m.SetupWizard })));

export function AppShell({ children }: { children: ReactNode }) {
  const { locked, setupComplete, ready, lock } = useVault();
  const [addAccountOpen, setAddAccountOpen] = useState(false);

  // ── Ask for notification permission right after the app is installed ──
  useEffect(() => {
    function onInstalled() {
      void enableSystemNotifications();
    }
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  // ── Lock vault when app goes to background (native only) ──
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;

    async function watch() {
      const { App } = await import("@capacitor/app");
      const handler = App.addListener("appStateChange", ({ isActive }) => {
        if (!isActive && !cancelled) {
          lock();
        }
      });
      return handler;
    }

    const p = watch();
    return () => {
      cancelled = true;
      p.then((h) => h.remove());
    };
  }, [lock]);

  // ── Wait for vault to load before deciding what to show ──
  if (!ready) return null;

  // ── First-run: profile not yet created ────────────────────────────────────
  if (!setupComplete) {
    return <Suspense fallback={null}><SetupWizard /></Suspense>;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Main Container */}
      <div className="flex flex-1 flex-col min-w-0 pb-16">
        <TopBar onAddAccount={() => setAddAccountOpen(true)} />

        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onAddAccount={() => setAddAccountOpen(true)} />

      {/* Global Add Account Modal */}
      <Suspense fallback={null}>
        <AddAccountModal open={addAccountOpen} onOpenChange={setAddAccountOpen} />
      </Suspense>

      {/* Lock Screen Overlay */}
      {locked && <LockScreen />}
    </div>
  );
}
