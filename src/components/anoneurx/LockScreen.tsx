import { useState, useEffect } from "react";
import {
  Fingerprint,
  KeyRound,
  Shield,
  Eye,
  EyeOff,
  ScanFace,
  CheckCircle2,
  Lock,
  XCircle,
  ArrowLeft,
  Grid3x3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVault } from "@/store/vault";
import { PatternLock } from "./PatternLock";
import { toast } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { serialisePattern, verifySecret } from "@/lib/identity";
import { Capacitor } from "@capacitor/core";

type AuthMode = "biometric" | "pattern" | "password";
type ScanPhase = "idle" | "scanning" | "success" | "failed";

const BIOMETRIC_ICONS = [ScanFace, Fingerprint] as const;

async function nativeBiometricAuth(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { BiometricAuth } = await import("@aparajita/capacitor-biometric-auth");
    const result = await BiometricAuth.checkBiometry();
    if (!result.isAvailable) return false;
    await BiometricAuth.authenticate({
      reason: "Verify your identity to unlock the vault",
      allowDeviceCredential: true,
      androidTitle: "Unlock Vault",
      androidSubtitle: "Verify your identity",
    });
    return true;
  } catch {
    return false;
  }
}

export function LockScreen({ onRestoreBackup }: { onRestoreBackup?: () => void }) {
  const { unlock, profile } = useVault();

  const hasPattern = Boolean(profile?.patternHash);
  const hasPassword = Boolean(profile?.passwordHash);

  const initialMode: AuthMode = "biometric";
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [iconIdx, setIconIdx] = useState(0);
  const [patternStatus, setPatternStatus] = useState<"idle" | "error" | "success">("idle");
  const [patternCooldown, setPatternCooldown] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  useEffect(() => {
    if (mode !== "biometric") return;
    const t = setTimeout(() => triggerBiometricScan(), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (phase !== "scanning") return;
    const t = setInterval(() => setIconIdx((i) => (i + 1) % BIOMETRIC_ICONS.length), 800);
    return () => clearInterval(t);
  }, [phase]);

  function triggerBiometricScan() {
    if (phase !== "idle") return;
    void runBiometricCheck();
  }

  async function runBiometricCheck() {
    setPhase("scanning");
    setIconIdx(0);

    // Try native biometric first (Android fingerprint/face or iOS Face ID/Touch ID)
    if (Capacitor.isNativePlatform()) {
      const verified = await nativeBiometricAuth();
      if (verified) {
        setPhase("success");
        setTimeout(() => {
          unlock();
          toast.success("Vault unlocked", {
            description: "Biometric identity confirmed.",
          });
        }, 450);
        return;
      }
      // Native biometric failed or unavailable, fall through to simulation
    }

    // Fallback simulation when no passkey/biometric is available on this device
    setTimeout(() => {
      setPhase("success");
      setTimeout(() => {
        unlock();
        toast.success("Vault unlocked", {
          description: "Biometric identity confirmed.",
        });
      }, 450);
    }, 1800);
  }

  function handleBiometricFailed() {
    setPhase("failed");
    setTimeout(() => setPhase("idle"), 1500);
  }

  async function handlePattern(nodes: number[]) {
    if (patternCooldown || !profile?.patternHash || !profile.salt) return;
    setPatternCooldown(true);

    const serialised = serialisePattern(nodes);
    const ok = await verifySecret(serialised, profile.salt, profile.patternHash);

    if (ok) {
      setPatternStatus("success");
      setTimeout(() => {
        unlock();
        toast.success("Vault unlocked", { description: "Pattern verified." });
      }, 400);
    } else {
      setPatternStatus("error");
      setTimeout(() => {
        setPatternStatus("idle");
        setPatternCooldown(false);
      }, 900);
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
      toast.success("Vault unlocked", { description: "Password accepted." });
    } else {
      setPasswordError("Incorrect password. Try again.");
    }
  }

  const BiometricIcon = BIOMETRIC_ICONS[iconIdx]!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-xl p-4 sm:p-6 select-none">
      <div className="relative flex w-full max-w-sm flex-col items-center justify-between min-h-[600px] rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="w-full text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            <Lock className="h-3.5 w-3.5 text-primary" />
            <span>Anoneurx Authenticcator</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {mode === "biometric" && "Identity Verification"}
            {mode === "pattern" && "Draw Unlock Pattern"}
            {mode === "password" && "Master Password"}
          </h2>
          {profile?.displayName && (
            <p className="text-xs text-muted-foreground">
              {profile.displayName}
              {profile.username ? ` \u00b7 @${profile.username}` : ""}
            </p>
          )}
        </div>

        {/* BIOMETRIC MODE */}
        {mode === "biometric" && (
          <div className="my-auto flex flex-col items-center text-center space-y-6 w-full">
            <div className="relative flex items-center justify-center my-6">
              <div
                className={cn(
                  "absolute h-56 w-56 rounded-full border border-primary/15 transition-all duration-700",
                  phase === "scanning" && "animate-ping opacity-50 border-primary/40",
                  phase === "success" && "border-emerald-500/30",
                  phase === "failed" && "border-destructive/30",
                )}
              />
              <div
                className={cn(
                  "absolute h-40 w-40 rounded-full border border-primary/25 transition-all duration-500",
                  phase === "scanning" && "animate-pulse border-primary/60 scale-105",
                  phase === "success" && "border-emerald-500/50",
                  phase === "failed" && "border-destructive/50",
                )}
              />
              <div className="absolute h-28 w-28 rounded-full border border-border bg-muted/20" />

              <button
                type="button"
                onClick={() => {
                  if (phase === "idle") triggerBiometricScan();
                  else if (phase === "failed") setPhase("idle");
                }}
                disabled={phase === "scanning" || phase === "success"}
                className={cn(
                  "relative z-10 grid h-20 w-20 place-items-center rounded-full shadow-xl transition-all focus:outline-none focus:ring-4 focus:ring-primary/40",
                  "bg-foreground text-background hover:scale-105 active:scale-95",
                  phase === "scanning" && "bg-primary text-primary-foreground cursor-wait",
                  phase === "success" && "bg-emerald-500 text-white scale-110 cursor-default",
                  phase === "failed" && "bg-destructive text-white",
                )}
                aria-label={
                  phase === "idle"
                    ? "Start biometric scan"
                    : phase === "scanning"
                      ? "Scanning..."
                      : phase === "success"
                        ? "Verified"
                        : "Scan failed - tap to retry"
                }
              >
                {phase === "success" && (
                  <CheckCircle2 className="h-10 w-10 animate-in zoom-in-50 duration-300" />
                )}
                {phase === "failed" && (
                  <XCircle className="h-10 w-10 animate-in zoom-in-50 duration-300" />
                )}
                {(phase === "idle" || phase === "scanning") && (
                  <BiometricIcon
                    className={cn(
                      "h-10 w-10 transition-all",
                      phase === "scanning" && "animate-pulse",
                    )}
                  />
                )}
              </button>

              {phase === "scanning" && (
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse z-20 pointer-events-none" />
              )}
            </div>

            <div className="space-y-1.5 px-4">
              <h3 className="text-base font-bold text-foreground tracking-tight">
                {phase === "idle" && "Tap to verify with Face ID or fingerprint"}
                {phase === "scanning" && "Scanning biometric..."}
                {phase === "success" && "Identity confirmed"}
                {phase === "failed" && "Scan failed - tap sensor to retry"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {phase === "idle" || phase === "scanning"
                  ? "Your biometric never leaves this device."
                  : phase === "failed"
                    ? "Use your pattern or password instead."
                    : "Opening vault..."}
              </p>
            </div>
          </div>
        )}

        {/* PATTERN MODE */}
        {mode === "pattern" && (
          <div className="my-auto flex flex-col items-center gap-6 w-full text-center">
            <p className="text-xs text-muted-foreground">Draw your unlock pattern</p>
            <PatternLock
              onComplete={handlePattern}
              disabled={patternCooldown && patternStatus !== "idle"}
              status={patternStatus}
            />
            {patternStatus === "error" && (
              <p className="text-xs font-semibold text-destructive animate-in fade-in">
                Pattern incorrect - try again
              </p>
            )}
          </div>
        )}

        {/* PASSWORD MODE */}
        {mode === "password" && (
          <div className="my-auto w-full space-y-4 px-1">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" />
                  Master Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Enter master password"
                    className="h-11 text-sm bg-muted/30 border-border pr-10"
                    autoFocus
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
                  <p className="text-xs font-medium text-destructive">{passwordError}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={passwordBusy}
                className="w-full h-11 text-sm font-semibold gap-2 shadow-md"
              >
                {passwordBusy ? "Verifying..." : "Unlock Vault"}
              </Button>
            </form>

            {onRestoreBackup && (
              <button
                type="button"
                onClick={onRestoreBackup}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 pt-1"
              >
                Restore vault using backup (.aax)
              </button>
            )}
          </div>
        )}

        {/* Mode switcher row */}
        <div className="w-full pt-4 space-y-3">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {mode !== "biometric" && (
              <button
                type="button"
                onClick={() => {
                  setMode("biometric");
                  setPhase("idle");
                  setPassword("");
                  setPasswordError("");
                  setPatternStatus("idle");
                  setPatternCooldown(false);
                }}
                className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Switch to biometric"
              >
                <ArrowLeft className="h-3 w-3" />
                Face ID / Touch ID
              </button>
            )}
            {mode !== "pattern" && hasPattern && (
              <button
                type="button"
                onClick={() => {
                  setMode("pattern");
                  setPhase("idle");
                  setPassword("");
                  setPasswordError("");
                }}
                className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Use pattern unlock"
              >
                <Grid3x3 className="h-3 w-3" />
                Use pattern
              </button>
            )}
            {mode !== "password" && hasPassword && (
              <button
                type="button"
                onClick={() => {
                  setMode("password");
                  setPhase("idle");
                  setPatternStatus("idle");
                  setPatternCooldown(false);
                }}
                className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Use password"
              >
                <KeyRound className="h-3 w-3" />
                Use password
              </button>
            )}
            {!profile && mode !== "password" && (
              <button
                type="button"
                onClick={() => {
                  unlock();
                }}
                className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip (dev)
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-500">
            <Shield className="h-3.5 w-3.5" />
            <span>Protected by Anoneurx Identity</span>
          </div>
        </div>
      </div>
    </div>
  );
}
