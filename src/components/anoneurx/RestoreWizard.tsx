import { useState } from "react";
import {
  Upload,
  FileCheck,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  HelpCircle,
  Loader2,
  HardDriveUpload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVault } from "@/store/vault";
import { BrandMark } from "./BrandMark";
import { toast } from "@/lib/notify";
import bgImage from "@/assets/background.jpg";
import { inspectAAXHeader, importFromAAX, AAXBackupError, type AAXDecryptedPayload } from "@/lib/aax-backup";
import { IDENTITY_QUESTIONS, createSalt, hashSecret, type IdentityAnswer } from "@/lib/identity";
import { cn } from "@/lib/utils";

interface RestoreWizardProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

type Step = "upload" | "password" | "questions" | "complete";

export function RestoreWizard({ onCancel, onSuccess }: RestoreWizardProps) {
  const { importAccounts, unlock, completeSetup } = useVault();

  const [step, setStep] = useState<Step>("upload");

  // Step 1 State: File upload
  const [fileText, setFileText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [fileDate, setFileDate] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // Step 2 State: Password decryption
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedPayload, setDecryptedPayload] = useState<AAXDecryptedPayload | null>(null);

  // Step 3 State: Security Questions
  const [ans1, setAns1] = useState("");
  const [ans2, setAns2] = useState("");
  const [questionsError, setQuestionsError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Selected identity questions for verification/setup
  const q1 = IDENTITY_QUESTIONS[0]!;
  const q2 = IDENTITY_QUESTIONS[1]!;

  // ── Step 1 Handlers: File Validation ──────────────────────────────────
  function validateAndSetFile(file: File) {
    setFileError("");
    if (!file.name.endsWith(".aax") && !file.name.endsWith(".json")) {
      setFileError("Invalid file extension. Please select an encrypted .aax backup file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content || !content.trim()) {
        setFileError("File is empty.");
        return;
      }
      try {
        const header = inspectAAXHeader(content);
        setFileText(content);
        setFileName(file.name);
        setFileSize((file.size / 1024).toFixed(1) + " KB");
        setFileDate(new Date(header.createdAt).toLocaleDateString());
        setFileError("");
      } catch (err) {
        if (err instanceof AAXBackupError) {
          if (err.type === "corrupted") setFileError("File is corrupted or not a valid .aax backup.");
          else if (err.type === "unsupported-version") setFileError("Unsupported backup file version.");
          else setFileError(err.message);
        } else {
          setFileError("Could not read backup file format.");
        }
      }
    };
    reader.onerror = () => {
      setFileError("Failed to read the file from disk.");
    };
    reader.readAsText(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  }

  // ── Step 2 Handlers: Decrypt ───────────────────────────────────────────
  async function handleDecrypt(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      setPasswordError("Enter your backup decryption password.");
      return;
    }
    setDecrypting(true);
    setPasswordError("");
    try {
      const payload = await importFromAAX(fileText, password);
      setDecryptedPayload(payload);
      toast.success("Backup file decrypted!", {
        description: `Found ${payload.accounts.length} authenticator entry(ies).`,
      });
      setStep("questions");
    } catch (err) {
      if (err instanceof AAXBackupError && err.type === "wrong-password") {
        setPasswordError("Incorrect backup password. Check password and try again.");
      } else {
        setPasswordError("Decryption failed. The file may be damaged or password incorrect.");
      }
    } finally {
      setDecrypting(false);
    }
  }

  // ── Step 3 Handlers: Security Questions ────────────────────────────────
  async function handleCompleteRestore(e: React.FormEvent) {
    e.preventDefault();
    if (!ans1.trim() || ans1.trim().length < 2) {
      setQuestionsError("Please provide an answer for Question 1 (min 2 chars).");
      return;
    }
    if (!ans2.trim() || ans2.trim().length < 2) {
      setQuestionsError("Please provide an answer for Question 2 (min 2 chars).");
      return;
    }

    if (!decryptedPayload) {
      setQuestionsError("No decrypted payload found.");
      return;
    }

    setSubmitting(true);
    setQuestionsError("");

    try {
      const salt = createSalt();
      const identity: IdentityAnswer[] = [
        { id: q1.id, question: q1.question, answerHash: await hashSecret(ans1, salt) },
        { id: q2.id, question: q2.question, answerHash: await hashSecret(ans2, salt) },
      ];

      // Restore profile and accounts into vault store
      const count = importAccounts(decryptedPayload.accounts);

      const restoredProfile = {
        username: "restored_user",
        displayName: "Restored User",
        passwordHash: await hashSecret(password, salt),
        patternHash: null,
        salt,
        identity,
        enabledUnlock: ["password" as const],
        createdAt: Date.now(),
      };

      completeSetup(restoredProfile);
      setStep("complete");
      toast.success("Vault successfully restored!", {
        description: `${count} accounts loaded into your local vault.`,
      });
    } catch {
      setQuestionsError("An error occurred during vault restoration.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleFinish() {
    unlock();
    if (onSuccess) onSuccess();
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
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      {/* Glassmorphism Card matching SetupWizard */}
      <div className="relative z-10 w-full max-w-[420px] rounded-[5px] from-white/20 via-white/5 to-white/10 p-px shadow-[0_24px_80px_-12px_rgba(0,0,0,0.7)]">
        <div className="flex min-h-[580px] flex-col justify-between rounded-[5px] border border-white/10 bg-zinc-950/70 p-6 backdrop-blur-2xl sm:p-7">
          
          {/* Header */}
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-foreground">
                <BrandMark className="h-7 w-7 object-contain" />
                <span
                  className="text-xs font-bold tracking-tight"
                  style={{ fontFamily: "'Anurati', var(--font-display)" }}
                >
                  ANONEURX RESTORE
                </span>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Cancel
              </button>
            </div>

            {/* Step indicator pills */}
            <div className="flex items-center justify-between gap-1.5 pt-4">
              <StepBadge stepNum={1} active={step === "upload"} done={step !== "upload"} label="File" />
              <StepBadge stepNum={2} active={step === "password"} done={step === "questions" || step === "complete"} label="Decrypt" />
              <StepBadge stepNum={3} active={step === "questions"} done={step === "complete"} label="Identity" />
            </div>
          </div>

          {/* ── STEP 1: UPLOAD .AAX FILE ── */}
          {step === "upload" && (
            <div className="my-auto space-y-4 pt-2">
              <div className="space-y-1 text-center">
                <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center justify-center gap-2">
                  <HardDriveUpload className="h-5 w-5 text-primary" />
                  Select Backup (.aax)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Choose your encrypted vault backup file to begin restoration.
                </p>
              </div>

              {/* Drag & drop file area */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer",
                  dragOver ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/50 bg-white/5",
                  fileText && "border-emerald-500/50 bg-emerald-500/10"
                )}
              >
                <input
                  type="file"
                  accept=".aax,.json"
                  onChange={handleFileInput}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />

                {fileText ? (
                  <div className="space-y-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mx-auto">
                      <FileCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground truncate max-w-[240px] mx-auto">
                        {fileName}
                      </p>
                      <p className="text-xs text-emerald-400 font-medium mt-0.5">
                        Valid AAX Backup • {fileSize} {fileDate ? `• ${fileDate}` : ""}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/40 text-muted-foreground mx-auto">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Drop your .aax file here, or <span className="text-primary underline">browse</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Only valid encrypted Anoneurx backup files are accepted
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {fileError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              <Button
                type="button"
                disabled={!fileText}
                onClick={() => setStep("password")}
                className="w-full h-11 text-sm font-semibold gap-2 shadow-md mt-2"
              >
                Continue to Password
              </Button>
            </div>
          )}

          {/* ── STEP 2: BACKUP DECRYPTION PASSWORD ── */}
          {step === "password" && (
            <form onSubmit={handleDecrypt} className="my-auto space-y-4 pt-2">
              <div className="space-y-1 text-center">
                <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center justify-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  Backup Password
                </h3>
                <p className="text-xs text-muted-foreground">
                  Enter the password used to encrypt <span className="text-foreground font-mono">{fileName}</span>.
                </p>
              </div>

              <div className="space-y-1.5 text-left pt-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Decryption Password
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Enter backup password"
                    className="h-11 text-sm bg-white/5 border-border pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs font-medium text-destructive pt-1 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("upload")}
                  className="h-11 px-4 text-xs border-white/10 hover:bg-white/5"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={decrypting}
                  className="flex-1 h-11 text-sm font-semibold gap-2 shadow-md"
                >
                  {decrypting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Decrypting...
                    </>
                  ) : (
                    "Decrypt & Continue"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* ── STEP 3: SECURITY QUESTIONS ── */}
          {step === "questions" && (
            <form onSubmit={handleCompleteRestore} className="my-auto space-y-4 pt-1">
              <div className="space-y-1 text-center">
                <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center justify-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Security Questions
                </h3>
                <p className="text-xs text-muted-foreground">
                  Provide recovery answers to protect your restored vault.
                </p>
              </div>

              <div className="space-y-3.5 pt-1 text-left">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    1. {q1.question}
                  </Label>
                  <Input
                    type="text"
                    value={ans1}
                    onChange={(e) => {
                      setAns1(e.target.value);
                      setQuestionsError("");
                    }}
                    placeholder={q1.placeholder}
                    className="h-10 text-xs bg-white/5 border-border"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    2. {q2.question}
                  </Label>
                  <Input
                    type="text"
                    value={ans2}
                    onChange={(e) => {
                      setAns2(e.target.value);
                      setQuestionsError("");
                    }}
                    placeholder={q2.placeholder}
                    className="h-10 text-xs bg-white/5 border-border"
                  />
                </div>

                {questionsError && (
                  <p className="text-xs font-medium text-destructive pt-1 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {questionsError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("password")}
                  className="h-11 px-4 text-xs border-white/10 hover:bg-white/5"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-11 text-sm font-semibold gap-2 shadow-md"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    "Restore Vault"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* ── STEP 4: COMPLETE ── */}
          {step === "complete" && (
            <div className="my-auto flex flex-col items-center text-center space-y-5 pt-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-in zoom-in duration-300">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-extrabold text-foreground tracking-tight">
                  Vault Restored!
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                  Your TOTP security codes and preferences have been safely imported onto this device.
                </p>
              </div>

              <div className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 space-y-1">
                <p className="font-semibold flex items-center justify-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  {decryptedPayload?.accounts.length ?? 0} Accounts Ready
                </p>
                <p className="text-[11px] opacity-80">Local encryption active • Zero network calls</p>
              </div>

              <Button
                type="button"
                onClick={handleFinish}
                className="w-full h-11 text-sm font-bold gap-2 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Open Restored Vault
              </Button>
            </div>
          )}

          {/* Footer badge */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-500 border-t border-white/10 pt-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Encrypted local restoration</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepBadge({ stepNum, active, done, label }: { stepNum: number; active: boolean; done: boolean; label: string }) {
  return (
    <div
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-full py-1 px-2.5 text-[10px] font-semibold transition-all border",
        active && "border-primary bg-primary/20 text-primary-foreground",
        done && "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
        !active && !done && "border-white/10 bg-white/5 text-muted-foreground"
      )}
    >
      <span className="h-4 w-4 rounded-full flex items-center justify-center text-[9px] bg-white/10">
        {done ? "✓" : stepNum}
      </span>
      <span>{label}</span>
    </div>
  );
}
