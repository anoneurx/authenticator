import { useEffect, useState } from "react";
import { Shield, Eye, EyeOff, Lock, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVault } from "@/store/vault";
import { BrandMark } from "./BrandMark";
import { RestoreWizard } from "./RestoreWizard";
import { toast, notifySystem } from "@/lib/notify";
import { verifySecret } from "@/lib/identity";
import { authenticateBiometric } from "@/lib/biometric";
import bgImage from "@/assets/background.jpg";

export function LockScreen() {
  const { unlock, profile, settings } = useVault();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const biometricEligible = Boolean(
    settings.biometricUnlock && profile?.enabledUnlock?.includes("biometric"),
  );

  // Auto-prompt biometric unlock as soon as the lock screen appears.
  useEffect(() => {
    if (!biometricEligible) return;
    let cancelled = false;
    async function tryBiometric() {
      const ok = await authenticateBiometric(
        "Unlock your vault with biometrics",
      );
      if (cancelled) return;
      if (ok) {
        unlock();
        notifySystem("Vault unlocked", "Vault was unlocked via biometric.");
      }
    }
    void tryBiometric();
    return () => {
      cancelled = true;
    };
  }, [biometricEligible, unlock]);

  async function handleBiometricUnlock() {
    if (biometricBusy || !biometricEligible) return;
    setBiometricBusy(true);
    const ok = await authenticateBiometric("Unlock your vault with biometrics");
    setBiometricBusy(false);
    if (ok) {
      unlock();
      notifySystem("Vault unlocked", "Vault was unlocked via biometric.");
      toast.success("Vault unlocked", { description: "Biometric accepted." });
    } else {
      toast.error("Biometric unlock canceled", {
        description: "Use your master password to unlock instead.",
      });
    }
  }

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none overflow-hidden dark theme-dark"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-[420px] rounded-[5px] from-white/20 via-white/5 to-white/10 p-px shadow-[0_24px_80px_-12px_rgba(0,0,0,0.7)]">
        <div className="flex min-h-[480px] flex-col justify-between rounded-[5px] border border-white/10 bg-zinc-950/70 p-6 backdrop-blur-2xl sm:p-7">
          <div className="w-full text-center space-y-3 pt-2">
            <div className="flex flex-col items-center justify-center gap-2">
              <BrandMark size={52} className="object-contain drop-shadow-xl" />
              <span
                className="text-sm font-bold tracking-tight"
                style={{
                  fontFamily: "'Anurati', var(--font-display)",
                  color: "#ffffff",
                }}
              >
                AUTHENTICATOR
              </span>
            </div>
          </div>

          <div className="my-auto w-full space-y-5 px-1 pt-4">
            <div className="text-center space-y-1">
              <h2
                className="text-lg font-semibold flex items-center justify-center gap-2"
                style={{ color: "#ffffff" }}
              >
                <Lock className="h-4 w-4" />
                Master Password
              </h2>
              {profile && (
                <p
                  className="text-xs"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  {profile.displayName}
                  {profile.username ? ` · @${profile.username}` : ""}
                </p>
              )}
            </div>
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
                    className="h-11 text-sm bg-white/5 border-white/10 pr-10 focus-visible:ring-primary placeholder:text-white/40"
                    style={{ color: "#ffffff" }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs font-medium text-destructive pt-1">
                    {passwordError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={passwordBusy}
                className="w-full h-11 text-sm font-semibold gap-2 shadow-lg bg-primary hover:bg-primary/90"
              >
                {passwordBusy ? "Verifying..." : "Unlock Vault"}
              </Button>

              {biometricEligible && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={biometricBusy}
                  onClick={() => void handleBiometricUnlock()}
                  className="w-full h-11 text-sm font-semibold gap-2 border-white/15 bg-white/5 hover:bg-white/10 hover:text-white"
                  style={{ color: "#ffffff" }}
                >
                  {biometricBusy ? (
                    <>
                      <Fingerprint className="h-4 w-4 animate-pulse text-emerald-400" />
                      Scanning…
                    </>
                  ) : (
                    <>
                      <Fingerprint className="h-4 w-4 text-emerald-400" />
                      Unlock with biometrics
                    </>
                  )}
                </Button>
              )}
            </form>

            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => setIsRestoring(true)}
                className="text-xs font-medium underline underline-offset-2 transition-colors"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Restore vault using backup (.aax)
              </button>
            </div>
          </div>

          <div className="w-full pt-4 space-y-3 border-t border-white/10">
            {!profile && (
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => unlock()}
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
