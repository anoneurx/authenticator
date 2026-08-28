import { Link, useRouterState } from "@tanstack/react-router";
import { Shield, KeyRound, HardDriveDownload, ShieldCheck, Settings, Lock } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { useVault } from "@/store/vault";

export function Sidebar() {
  const { lock } = useVault();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const navItems = [
    { label: "Authenticator", to: "/", icon: KeyRound },
    { label: "Backup", to: "/backup", icon: HardDriveDownload },
    { label: "Security", to: "/security", icon: ShieldCheck },
    { label: "Settings", to: "/settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar p-4 select-none shrink-0 justify-between min-h-screen sticky top-0">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-1">
          <BrandMark className="h-8 w-8 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-tight text-sidebar-foreground truncate">
              Anoneurx Authenticcator
            </h1>
            <p className="text-[11px] text-muted-foreground truncate">Offline Authenticator</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.to === "/"
                ? currentPath === "/"
                : currentPath.startsWith(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer status section */}
      <div className="space-y-3 pt-4 border-t border-sidebar-border">
        <button
          type="button"
          onClick={lock}
          className="flex w-full items-center justify-between rounded-lg border border-sidebar-border bg-surface px-3 py-2 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
        >
          <span className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            Lock Vault
          </span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
            ⌘L
          </kbd>
        </button>

        <div className="rounded-lg bg-surface/60 p-3 HAIRLINE border border-sidebar-border space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-sidebar-foreground">Offline</span>
            </div>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              Local
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
            <Shield className="h-3.5 w-3.5 shrink-0" />
            <span>Vault Protected</span>
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Your secrets stay on this device. No network calls or cloud sync.
          </p>
        </div>
      </div>
    </aside>
  );
}
