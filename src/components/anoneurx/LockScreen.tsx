import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Fingerprint,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVault } from "@/store/vault";
import { BrandMark } from "./BrandMark";
import { RestoreWizard } from "./RestoreWizard";
import { toast, notifySystem } from "@/lib/notify";
import { verifySecret } from "@/lib/identity";
import bgImage from "@/assets/background.jpg";
import { Capacitor } from "@capacitor/core";

/**
 * Attempt native biometric auth (fingerprint / face).
 * Returns true if the user authenticated successfully.
 */
async function promptBiometric(reason: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { BiometricAuth, BiometryType } = await import("@aparajita/capacitor-biometric-auth");

    const check = await BiometricAuth.checkBiometry();
    if (!check.isAvailable || check.biometryType === BiometryType.none) return false;

    await BiometricAuth.authenticate({
      reason,
      cancelTitle: "Use Password",
      allowDeviceCredential: true,
    });
    return true;
  } catch {
    return false;
  }
}

export function LockScreen({ onRestoreBackup }: { onRestoreBackup?: () => void }) {
  const { unlock, profile, settings } = useVault();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);

  // ── Check biometric availability and auto-prompt ──
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!Capacitor.isNativePlatform()) return;
      if (!settings.biometricUnlock) return;

      try {
        const { BiometricAuth, BiometryType } = await import("@aparajita/capacitor-biometric-auth");

        const check = await BiometricAuth.checkBiometry();
        if (cancelled) return;
        if (!check.isAvailable || check.biometryType === BiometryType.none) return;

        setBiometricReady(true);

        // Auto-prompt biometric immediately
        await BiometricAuth.authenticate({
          reason: "Unlock your vault",
          cancelTitle: "Use Password",
          allowDeviceCredential: true,
        });
        if (cancelled) return;

        unlock();
        notifySystem("Vault unlocked", "Vault was unlocked via biometric.");
        toast.success("Vault unlocked", { description: "Biometric authentication accepted." });
      } catch {
        // Biometric not available — show password form
      }
    }

    init();
    return () => { cancelled = true; };
  }, [unlock, settings.biometricUnlock]);

  const handleBiometricUnlock = useCallback(async () => {
    setBiometricBusy(true);
    const ok = await promptBiometric("Unlock your vault");
    setBiometricBusy(false);
    if (ok) {
      unlock();
      notifySystem("Vault unlocked", "Vault was unlocked via biometric.");
      toast.success("Vault unlocked", { description: "Biometric authentication accepted." });
    }
  }, [unlock]);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      setPasswordError("Enter your master password.");
      return;
    }
    if (!profile?.passwordHash || !profile.salt) {
      unlock();
      return;
    }
    setPasswordBusy(true);
    setPasswordError("");
    const ok = await verifySecret(password, profile.salt, profile.passwordHash);
    setPasswordBusy(false);
    if (ok) {
      unlock();
      notifySystem("Vault unlocked", "Vault was unlocked.");
      toast.success("Vault unlocked", { description: "Password accepted." });
    } else {
      setPasswordError("Incorrect password. Try again.");
    }
  }

  if (isRestoring) {
    return (
      <RestoreWizard
        onCancel={() => setIsRestoring(false)}
        onSuccess={() => setIsRestoring(false)}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none overflow-hidden"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-[420px] rounded-[5px] from-white/20 via-white/5 to-white/10 p-px shadow-[0_24px_80px_-12px_rgba(0,0,0,0.7)]">
        <div className="flex min-h-[580px] flex-col justify-between rounded-[5px] border border-white/10 bg-zinc-950/70 p-6 backdrop-blur-2xl sm:p-7">
          {/* Header */}
          <div className="w-full text-center space-y-3 pt-2">
            <div className="flex flex-col items-center justify-center gap-2">
              <BrandMark size={52} className="object-contain drop-shadow-xl" />
              <span
                className="text-sm font-bold tracking-tight text-foreground"
                style={{ fontFamily: "'Anurati', var(--font-display)" }}
              >
                AUTHENTICATOR
              </span>
            </div>
            <div className="space-y-1 pt-1 border-t border-white/10">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                {biometricReady ? "Unlock Vault" : "Master Password"}
              </h2>
              {profile?.displayName ? (
                <p className="text-xs text-muted-foreground">
                  {profile.displayName}
                  {profile.username ? ` \u00b7 @${profile.username}` : ""}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Enter password to unlock your vault</p>
              )}
            </div>
          </div>

          {/* UNLOCK OPTIONS */}
          <div className="my-auto w-full space-y-5 px-1 pt-2">
            {/* Biometric unlock button */}
            {biometricReady && (
              <div className="flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={handleBiometricUnlock}
                  disabled={biometricBusy}
                  className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 backdrop-blur-sm transition-all hover:bg-primary/20 hover:border-primary/50 hover:scale-105 active:scale-95 disabled:opacity-50"
                  title="Unlock with biometric"
                  aria-label="Unlock with fingerprint or face"
                >
                  {biometricBusy ? (
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <Fingerprint className="h-10 w-10 text-primary" />
                  )}
                </button>
                <p className="text-xs text-muted-foreground">
                  Tap to unlock with fingerprint or face
                </p>

                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-[11px]">
                    <span className="bg-zinc-950/70 px-3 text-muted-foreground">or use password</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Enter master password"
                    className="h-11 text-sm bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/60 pr-10 focus-visible:ring-primary"
                    autoFocus={!biometricReady}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs font-medium text-destructive pt-1">{passwordError}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={passwordBusy}
                className="w-full h-11 text-sm font-semibold gap-2 shadow-lg bg-primary hover:bg-primary/90"
              >
                {passwordBusy ? "Verifying..." : "Unlock Vault"}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => setIsRestoring(true)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 pt-1 transition-colors"
            >
              Restore vault using backup (.aax)
            </button>
          </div>

          {/* Footer row */}
          <div className="w-full pt-4 space-y-3 border-t border-white/10">
            {!profile && (
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    unlock();
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip (dev)
                </button>
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <Shield className="h-3.5 w-3.5" />
              <span>Protected by Authenticator Identity</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

