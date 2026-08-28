import { Link, useRouterState } from "@tanstack/react-router";
import { KeyRound, Settings, QrCode } from "lucide-react";

export function MobileBottomNav({
  onAddAccount,
}: {
  onAddAccount: () => void;
}) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    /* Mobile Bottom Navigation Bar */
    <div className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center border-t border-border bg-card/95 backdrop-blur-md md:hidden select-none">
      {/* Left tab — Authenticator */}
      <Link
        to="/"
        className={`flex flex-1 flex-col items-center justify-center py-1 text-xs font-semibold transition-colors ${
          currentPath === "/"
            ? "text-[#0078D4] dark:text-[#38BDF8]"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <KeyRound className="h-5 w-5 mb-0.5" />
        <span>Authenticator</span>
      </Link>

      {/* Center QR FAB — raised above the bar */}
      <div className="relative flex flex-col items-center justify-end pb-1" style={{ width: 72 }}>
        <button
          type="button"
          onClick={onAddAccount}
          className="absolute -top-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#0078D4] text-white shadow-2xl ring-4 ring-card transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-[#0078D4]/40"
          title="Scan QR Code / Add Account"
          aria-label="Scan QR Code"
        >
          <QrCode className="h-7 w-7" />
        </button>
        <span className="mt-8 text-[10px] font-semibold text-muted-foreground">Scan</span>
      </div>

      {/* Right tab — Settings */}
      <Link
        to="/settings"
        className={`flex flex-1 flex-col items-center justify-center py-1 text-xs font-semibold transition-colors ${
          currentPath.startsWith("/settings")
            ? "text-[#0078D4] dark:text-[#38BDF8]"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Settings className="h-5 w-5 mb-0.5" />
        <span>Settings</span>
      </Link>
    </div>
  );
}
