import { useState } from "react";
import {
  ShieldCheck,
  WifiOff,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  UserRound,
  AtSign,
  LockKeyhole,
  AlertCircle,
  Loader2,
  Sparkles,
  Fingerprint,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVault } from "@/store/vault";
import {
  IDENTITY_QUESTIONS,
  createSalt,
  hashSecret,
  passwordStrength,
  type IdentityAnswer,
  type UnlockMethod,
} from "@/lib/identity";
import { cn } from "@/lib/utils";
import { toast, enableSystemNotifications } from "@/lib/notify";
import { hasRegisteredPasskey, registerPasskey } from "@/lib/webauthn";
import bgImage from "@/assets/background.jpg";
import { BrandMark } from "./BrandMark";

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

const TOTAL_STEPS = 5;

// 5 steps total: 0-2 feature slides, 3 identity questions, 4 credentials
type Step = 0 | 1 | 2 | 3 | 4;

const STRENGTH_BARS = [
  "bg-red-500",
  "bg-red-500",
  "bg-amber-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-emerald-400",
];

export function SetupWizard() {
  const { completeSetup } = useVault();
  const [step, setStep] = useState<Step>(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  // identity answers
  const picked = IDENTITY_QUESTIONS.slice(0, 3);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // credentials
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [salt] = useState(() => createSalt());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const strength = passwordStrength(password);
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const isIntro = step <= 2;
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
    goTo(4);
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
      completeSetup({
        username: username.trim(),
        displayName: displayName.trim(),
        passwordHash: await hashSecret(password, salt),
        patternHash: null,
        salt,
        identity,
        enabledUnlock,
        createdAt: Date.now(),
      });
      toast.success("Vault created", {
        description: "Use your master password to unlock.",
      });

      // ── Device security prompts (same user gesture, best-effort) ──
      await enableSystemNotifications();
    } finally {
      setBusy(false);
    }
  }

  const slideAnim =
    direction === "forward"
      ? "animate-in fade-in slide-in-from-right-6 duration-300"
      : "animate-in fade-in slide-in-from-left-6 duration-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto p-4 sm:p-6">
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
                ANONEURX AUTHENTICATOR
              </span>
            </div>
          </div>

          {/* ── Feature slides (steps 0-2) ── */}
          {isIntro && (
            <div key={`intro-${step}`} className={cn("my-auto flex flex-col", slideAnim)}>
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

          {/* ── Identity questions (step 3) ── */}
          {step === 3 && (
            <div key="identity" className={cn("my-auto w-full space-y-4 py-2", slideAnim)}>
              <div className="space-y-1.5 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Fingerprint className="h-3 w-3" />
                  Recovery setup
                </span>
                <h2 className="pt-1 text-xl font-bold tracking-tight">Identity questions</h2>
                <p className="mx-auto max-w-[300px] text-xs leading-relaxed text-muted-foreground">
                  Used only on this device to recover access. Answers are hashed, never stored as
                  text.
                </p>
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
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    className="h-10 border-border/70 bg-background/40 text-sm transition-shadow focus-visible:shadow-[0_0_0_3px_var(--primary)]/15"
                    autoComplete="off"
                    maxLength={80}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── Credentials (step 4 — final) ── */}
          {step === 4 && (
            <div key="credentials" className={cn("my-auto w-full space-y-4 py-2", slideAnim)}>
              <div className="space-y-1.5 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <ShieldCheck className="h-3 w-3" />
                  Almost done
                </span>
                <h2 className="pt-1 text-xl font-bold tracking-tight">Create your account</h2>
                <p className="mx-auto max-w-[300px] text-xs leading-relaxed text-muted-foreground">
                  This account lives only on this device — nobody else can ever see it.
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
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                            i < strength.score ? STRENGTH_BARS[strength.score] : "bg-muted",
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
              <Button
                className="h-11 flex-1 gap-2 bg-gradient-to-r from-primary to-sky-500 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:brightness-110 active:scale-[0.99]"
                disabled={busy}
                onClick={() => {
                  if (step <= 2) goTo((step + 1) as Step);
                  else if (step === 3) validateIdentity();
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
                ) : step === 3 ? (
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
