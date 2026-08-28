import { ShieldCheck, Fingerprint, Lock, ShieldAlert, KeyRound, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVault } from "@/store/vault";
import { AUTO_LOCK_LABELS, type AutoLockDelay } from "@/lib/vault-types";
import { toast } from "@/lib/notify";

export function SecurityPanel() {
  const { settings, updateSettings, lock } = useVault();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Security & Protection
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage vault locking, biometric access, and local device authentication settings.
        </p>
      </div>

      {/* Vault Status Overview */}
      <div className="rounded-xl border border-border bg-card p-5 HAIRLINE space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">Vault Protection</h3>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                  Protected
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Unlock method: Device authentication & PIN
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={lock}
            className="h-9 gap-2 text-xs font-medium border-border hover:bg-accent"
          >
            <Lock className="h-3.5 w-3.5" />
            Lock immediately
          </Button>
        </div>

        {/* Security Options */}
        <div className="space-y-4 pt-1">
          {/* Biometric unlock toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label
                htmlFor="biometric-toggle"
                className="text-sm font-medium flex items-center gap-2"
              >
                <Fingerprint className="h-4 w-4 text-primary" />
                Enable Biometric Unlock
              </Label>
              <p className="text-xs text-muted-foreground">
                Use fingerprint, Touch ID, or Face ID to quickly unlock your vault.
              </p>
            </div>
            <Switch
              id="biometric-toggle"
              checked={settings.biometricUnlock}
              onCheckedChange={(checked) => {
                updateSettings({ biometricUnlock: checked });
                toast.success(checked ? "Biometric unlock enabled" : "Biometric unlock disabled");
              }}
            />
          </div>

          <div className="border-t border-border" />

          {/* Require auth on launch toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label
                htmlFor="launch-auth-toggle"
                className="text-sm font-medium flex items-center gap-2"
              >
                <KeyRound className="h-4 w-4 text-primary" />
                Require Authentication on Launch
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically lock the vault whenever the app is opened or refreshed.
              </p>
            </div>
            <Switch
              id="launch-auth-toggle"
              checked={settings.requireAuthOnLaunch}
              onCheckedChange={(checked) => {
                updateSettings({ requireAuthOnLaunch: checked });
                toast.success(
                  checked ? "Authentication required on launch" : "Launch protection disabled",
                );
              }}
            />
          </div>

          <div className="border-t border-border" />

          {/* Auto-lock choice */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label
                htmlFor="autolock-select"
                className="text-sm font-medium flex items-center gap-2"
              >
                <Lock className="h-4 w-4 text-primary" />
                Auto-lock Timeout
              </Label>
              <p className="text-xs text-muted-foreground">
                Lock vault automatically after a period of inactivity.
              </p>
            </div>
            <Select
              value={settings.autoLock}
              onValueChange={(val) => {
                updateSettings({ autoLock: val as AutoLockDelay });
                toast.success(`Auto-lock set to ${AUTO_LOCK_LABELS[val as AutoLockDelay]}`);
              }}
            >
              <SelectTrigger id="autolock-select" className="w-44 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(AUTO_LOCK_LABELS) as AutoLockDelay[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {AUTO_LOCK_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Encryption & Core Information Card */}
      <div className="rounded-xl border border-border bg-surface p-5 HAIRLINE space-y-3">
        <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
          <Cpu className="h-4 w-4 text-primary" />
          <span>Local Encryption Architecture</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your authenticator vault is encrypted locally on this device. Decryption keys never leave
          local memory and are bound to your local authentication session.
        </p>
        <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>No analytics • No network calls • Offline isolated</span>
        </div>
      </div>
    </div>
  );
}
