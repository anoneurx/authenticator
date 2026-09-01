import { useState } from "react";
import {
  ShieldCheck,
  WifiOff,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
  UserRound,
  AtSign,
  LockKeyhole,
  AlertCircle,
  Loader2,
  Sparkles,
  Fingerprint,
  Plus,
  HardDriveUpload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useVault } from "@/store/vault";
import { biometricAvailability, authenticateBiometric } from "@/lib/biometric";
import {
  IDENTITY_QUESTIONS,
  createSalt,
  hashSecret,
  passwordStrength,
  type IdentityAnswer,
  type UnlockMethod,
  type VaultProfile,
} from "@/lib/identity";
import { cn } from "@/lib/utils";
import { toast, enableSystemNotifications } from "@/lib/notify";
import { hasRegisteredPasskey, registerPasskey } from "@/lib/webauthn";
import bgImage from "@/assets/background.jpg";
import { BrandMark } from "./BrandMark";
import { RestoreWizard } from "./RestoreWizard";

const FEATURES = [
  {
    icon: WifiOff,
    eyebrow: "Private by design",
    title: "Fully offline",
    body: "No servers, no sync, no analytics. Every code is generated on this device and never leaves it.",
    tile: "border-sky-400/25 bg-sky-500/10 text-sky-400",
    glow: "bg-sky-500/25",
    chip: "border-sky-400/20 bg-sky-500/10 text-sky-300",
  },
  {
    icon: ShieldCheck,
    eyebrow: "Bank-grade security",
    title: "Encrypted vault",
    body: "Secrets are sealed with AES-256-GCM and unlocked only by your master password.",
    tile: "border-emerald-400/25 bg-emerald-500/10 text-emerald-400",
    glow: "bg-emerald-500/25",
    chip: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  },
  {
    icon: KeyRound,
    eyebrow: "Own your data",
    title: "Portable backups",
    body: "Export a single encrypted .aax file and restore it on any other device whenever you like.",
    tile: "border-violet-400/25 bg-violet-500/10 text-violet-400",
    glow: "bg-violet-500/25",
    chip: "border-violet-400/20 bg-violet-500/10 text-violet-300",
  },
];

// Steps: 0-2 features, 3 account choice, 4 identity questions, 5 credentials,
// 6 biometric unlock
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const STRENGTH_BARS = [
  "bg-red-500",
  "bg-red-500",
  "bg-amber-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-emerald-400",
];

export function SetupWizard() {
  const { completeSetup, updateSettings } = useVault();
  const [step, setStep] = useState<Step>(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [showRestore, setShowRestore] = useState(false);

  // identity answers
  const picked = IDENTITY_QUESTIONS.slice(0, 3);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // credentials
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);

  // built profile (not committed until the biometric step resolves)
  const [pendingProfile, setPendingProfile] = useState<VaultProfile | null>(
    null,
  );
  const [biometryName, setBiometryName] = useState("Biometric");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);

  const [salt] = useState(() => createSalt());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const strength = passwordStrength(password);
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const isIntro = step <= 2;
  const isAccountChoice = step === 3;
  const featureIdx = Math.min(step, 2);
  const feature = FEATURES[featureIdx]!;
  const FeatureIcon = feature.icon;

  function goTo(next: Step) {
    setDirection(next > step ? "forward" : "back");
    setError("");
    setStep(next);
  }

  function back() {
    if (step > 0) goTo((step - 1) as Step);
  }

  function validateIdentity() {
    const missing = picked.filter((q) => !(answers[q.id] ?? "").trim());
    if (missing.length) {
      setError("Please answer all three identity questions.");
      return;
    }
    goTo(5);
  }

  async function finish() {
    if (displayName.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    if (!/^[a-zA-Z0-9._-]{3,24}$/.test(username)) {
      setError("Username must be 3-24 characters (letters, numbers, . _ -).");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setBusy(true);
    try {
      const identity: IdentityAnswer[] = await Promise.all(
        picked.map(async (q) => ({
          id: q.id,
          question: q.question,
          answerHash: await hashSecret(answers[q.id] ?? "", salt),
        })),
      );
      const enabledUnlock: UnlockMethod[] = ["password"];
      const profile: VaultProfile = {
        username: username.trim(),
        displayName: displayName.trim(),
        passwordHash: await hashSecret(password, salt),
        patternHash: null,
        salt,
        identity,
        enabledUnlock,
        createdAt: Date.now(),
      };
      setPendingProfile(profile);

      const bio = await biometricAvailability();
      if (bio.available) {
        setBiometryName(bio.name);
        setDirection("forward");
        setStep(6);
        return;
      }

      await commitVault(profile, false);
    } catch (err) {
      console.error("Vault creation failed:", err);
      setError("Failed to create vault. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmBiometricToggle(checked: boolean) {
    if (!checked) {
      setBiometricEnabled(false);
      return;
    }
    setBiometricBusy(true);
    const confirmed = await authenticateBiometric(
      `Confirm your ${biometryName.toLowerCase()} / device passkey to enable biometric unlock`,
    );
    setBiometricBusy(false);
    if (confirmed) {
      setBiometricEnabled(true);
      toast.success("Biometric unlock enabled", {
        description: `Your ${biometryName.toLowerCase()} is now saved to unlock the vault.`,
      });
    } else {
      setBiometricEnabled(false);
      toast.error("Biometric unlock not enabled", {
        description:
          "Confirmation was canceled. You can enable it later from Settings.",
      });
    }
  }

  async function commitVault(profile: VaultProfile, enableBiometric: boolean) {
    try {
      const biometricOn = enableBiometric;
      const finalProfile: VaultProfile = biometricOn
        ? { ...profile, enabledUnlock: [...profile.enabledUnlock, "biometric"] }
        : profile;
      updateSettings({ biometricUnlock: biometricOn });
      completeSetup(finalProfile);
      toast.success("Vault created", {
        description: biometricOn
          ? "Use your fingerprint, Face ID or master password to unlock."
          : "Use your master password to unlock.",
      });

      await enableSystemNotifications();
    } catch (err) {
      console.error("Vault creation failed:", err);
      setError("Failed to create vault. Please try again.");
    }
  }

  const slideAnim =
    direction === "forward"
      ? "animate-in fade-in slide-in-from-right-6 duration-300"
      : "animate-in fade-in slide-in-from-left-6 duration-300";

  if (showRestore) {
    return (
      <RestoreWizard
        onCancel={() => setShowRestore(false)}
        onSuccess={() => setShowRestore(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto p-4 sm:p-6 dark theme-dark">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      {/* Ambient color blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-primary/20 blur-[120px]" />
        <div
          className={cn(
            "absolute -bottom-36 -right-20 h-96 w-96 rounded-full blur-[140px] transition-colors duration-700",
            feature.glow,
          )}
        />
      </div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-[420px] rounded-[5px]  from-white/20 via-white/5 to-white/10 p-px shadow-[0_24px_80px_-12px_rgba(0,0,0,0.7)]">
        <div className="flex min-h-[620px] flex-col rounded-[5px] border border-white/10 bg-zinc-950/70 p-5 backdrop-blur-2xl sm:min-h-[640px] sm:p-7">
          {/* Header: brand logo + title */}
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-foreground">
              <BrandMark className="h-12 w-12 object-contain shadow-lg" />
              <span
                className="text-sm font-bold tracking-tight"
                style={{ fontFamily: "'Anurati', var(--font-display)" }}
              >
                AUTHENTICATOR
              </span>
            </div>
          </div>

          {/* ── Feature slides (steps 0-2) ── */}
          {isIntro && (
            <div
              key={`intro-${step}`}
              className={cn("my-auto flex flex-col", slideAnim)}
            >
              <span
                className={cn(
                  "mx-auto mb-6 mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider",
                  feature.chip,
                )}
              >
                <Sparkles className="h-3 w-3" />
                {feature.eyebrow}
              </span>

              <div className="relative mx-auto grid place-items-center">
                <div
                  className={cn(
                    "absolute h-32 w-32 rounded-full blur-3xl transition-colors duration-700",
                    feature.glow,
                  )}
                />
                <div
                  className={cn(
                    "relative grid h-28 w-28 rotate-3 place-items-center rounded-[28px] border shadow-lg transition-transform duration-500 hover:rotate-0 hover:scale-105",
                    feature.tile,
                  )}
                >
                  <FeatureIcon className="h-12 w-12" strokeWidth={1.5} />
                </div>
              </div>

              <div className="mt-8 space-y-3 text-center">
                <h2 className="text-[1.75rem] font-extrabold leading-tight tracking-tight text-foreground">
                  {feature.title}
                </h2>
                <p className="mx-auto max-w-[300px] text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </div>
            </div>
          )}

          {/* ── Account choice (step 3) ── */}
          {isAccountChoice && (
            <div
              key="account-choice"
              className={cn("my-auto w-full space-y-5 py-2", slideAnim)}
            >
              <div className="space-y-1.5 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3 w-3" />
                  Get started
                </span>
                <h2 className="pt-1 text-xl font-bold tracking-tight">
                  Welcome to Authenticator
                </h2>
                <p className="mx-auto max-w-[300px] text-xs leading-relaxed text-muted-foreground">
                  Create a brand new vault on this device, or restore a previous
                  vault from a backup file.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {/* Create new account */}
                <button
                  type="button"
                  onClick={() => goTo(4)}
                  className="group flex w-full items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:bg-white/10 hover:border-primary/30 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary/25">
                    <Plus className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-foreground">
                      Create a New Account
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Set up a fresh vault with a new master password and
                      recovery questions.
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>

                {/* Recover previous account */}
                <button
                  type="button"
                  onClick={() => setShowRestore(true)}
                  className="group flex w-full items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:bg-white/10 hover:border-emerald-500/30 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 transition-colors group-hover:bg-emerald-500/25">
                    <HardDriveUpload className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-foreground">
                      Recover Previous Account
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Restore your codes from an encrypted .aax backup file.
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>
            </div>
          )}

          {/* ── Identity questions (step 4) ── */}
          {step === 4 && (
            <div
              key="identity"
              className={cn("my-auto w-full space-y-4 py-2", slideAnim)}
            >
              <div className="space-y-1.5 text-center">
                <h2 className="pt-1 text-xl font-bold tracking-tight">
                  Identity questions
                </h2>
              </div>

              {picked.map((q, qi) => (
                <div key={q.id} className="space-y-1.5">
                  <Label className="flex items-start gap-2 text-xs font-medium leading-snug">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                      {qi + 1}
                    </span>
                    {q.question}
                  </Label>
                  <Input
                    value={answers[q.id] ?? ""}
                    placeholder={q.placeholder}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                    }
                    className="h-10 border-border/70 bg-background/40 text-sm transition-shadow focus-visible:shadow-[0_0_0_3px_var(--primary)]/15"
                    autoComplete="off"
                    maxLength={80}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── Credentials (step 5 — final) ── */}
          {step === 5 && (
            <div
              key="credentials"
              className={cn("my-auto w-full space-y-4 py-2", slideAnim)}
            >
              <div className="space-y-1.5 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <ShieldCheck className="h-3 w-3" />
                  Almost done
                </span>
                <h2 className="pt-1 text-xl font-bold tracking-tight">
                  Create your account
                </h2>
                <p className="mx-auto max-w-[300px] text-xs leading-relaxed text-muted-foreground">
                  This account lives only on this device — nobody else can ever
                  see it.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Full name</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Katy Wilson"
                    className="h-10 border-border/70 bg-background/40 pl-9 text-sm"
                    maxLength={60}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Username</Label>
                <div className="relative">
                  <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="katy.w"
                    className="h-10 border-border/70 bg-background/40 pl-9 text-sm"
                    autoComplete="off"
                    maxLength={24}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Master password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="h-10 border-border/70 bg-background/40 pl-9 pr-10 text-sm"
                    maxLength={128}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPass ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {password && (
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <span
                          key={i}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-all duration-300",
                            i < strength.score
                              ? STRENGTH_BARS[strength.score]
                              : "bg-muted",
                          )}
                        />
                      ))}
                      <span
                        className={cn(
                          "w-[68px] text-right text-[11px] font-semibold",
                          strength.score >= 4
                            ? "text-emerald-500"
                            : strength.score >= 2
                              ? "text-amber-500"
                              : "text-red-500",
                        )}
                      >
                        {strength.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Confirm password</Label>
                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPass ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={cn(
                      "h-10 border-border/70 bg-background/40 pl-9 pr-9 text-sm",
                      confirm &&
                        (passwordsMatch
                          ? "border-emerald-500/50 focus-visible:ring-emerald-500/30"
                          : "border-destructive/60 focus-visible:ring-destructive/30"),
                    )}
                    maxLength={128}
                  />
                  {confirm && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {passwordsMatch ? (
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Biometric unlock (step 6 — final) ── */}
          {step === 6 && (
            <div
              key="biometric"
              className={cn("my-auto w-full space-y-5 py-2", slideAnim)}
            >
              <div className="space-y-1.5 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <Fingerprint className="h-3 w-3" />
                  One last step
                </span>
                <h2 className="pt-1 text-xl font-bold tracking-tight">
                  Unlock with biometrics?
                </h2>
                <p className="mx-auto max-w-[300px] text-xs leading-relaxed text-muted-foreground">
                  Skip typing your master password. Confirm once with your{" "}
                  {biometryName} or device passkey, then unlock the vault with a
                  single touch.
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Fingerprint className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {biometryName} / passkey lock
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {biometricBusy
                        ? "Confirming your biometric…"
                        : biometricEnabled
                          ? "Enabled — unlock with a single touch"
                          : "Ask for biometrics on every unlock"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={biometricEnabled}
                  disabled={biometricBusy}
                  onCheckedChange={(checked) =>
                    void confirmBiometricToggle(checked)
                  }
                />
              </div>

              {biometricBusy && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Confirm with your {biometryName} or device passkey…
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <Button
                  className="h-11 gap-2 bg-gradient-to-r from-primary to-sky-500 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:brightness-110 active:scale-[0.99]"
                  disabled={biometricBusy || busy}
                  onClick={() => {
                    if (!pendingProfile) return;
                    setBusy(true);
                    void commitVault(pendingProfile, biometricEnabled);
                  }}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Create my vault
                </Button>
                <button
                  type="button"
                  disabled={biometricBusy || busy}
                  onClick={() => {
                    if (!pendingProfile) return;
                    setBiometricEnabled(false);
                    setBusy(true);
                    void commitVault(pendingProfile, false);
                  }}
                  className="w-full text-center text-xs font-medium underline underline-offset-2 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="mt-4 flex animate-in items-center justify-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 fade-in duration-200">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
              <p className="text-xs font-medium text-destructive">{error}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-auto pt-6">
            <div className="flex items-center gap-2.5">
              {/* Main action button — hidden on account choice & biometric steps (buttons are in the step) */}
              {!isAccountChoice && step !== 6 && (
                <Button
                  className="h-11 flex-1 gap-2 bg-gradient-to-r from-primary to-sky-500 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:brightness-110 active:scale-[0.99]"
                  disabled={busy}
                  onClick={() => {
                    if (step <= 2) goTo((step + 1) as Step);
                    else if (step === 4) validateIdentity();
                    else void finish();
                  }}
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Securing your vault…
                    </>
                  ) : isIntro ? (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : step === 4 ? (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Create my vault
                      <ShieldCheck className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
            <p className="mt-3.5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/80">
              <LockKeyhole className="h-3 w-3" />
              Your data never leaves this device
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
