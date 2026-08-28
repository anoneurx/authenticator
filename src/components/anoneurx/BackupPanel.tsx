import { useState, useRef } from "react";
import {
  HardDriveDownload,
  HardDriveUpload,
  ShieldCheck,
  Lock,
  FileCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  CheckCircle2,
  FolderOpen,
  ScanLine,
  KeyRound,
  ListChecks,
  PartyPopper,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVault } from "@/store/vault";
import {
  BACKUP_FILENAME,
  createBackupPayloadAsync,
  openBackupPayloadAsync,
  readBackupPayload,
} from "@/lib/vault-storage";
import type { VaultAccount } from "@/lib/vault-types";
import { toast } from "@/lib/notify";
import { cn } from "@/lib/utils";

// ─── Import wizard step types ──────────────────────────────────────────────
type ImportStep = "select" | "validate" | "password" | "preview" | "confirm" | "done";

interface BackupHeader {
  version: number;
  createdAt?: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function maskAccount(value: string): string {
  if (value.length <= 4) return "••••";
  const at = value.indexOf("@");
  if (at > 1) {
    return value[0] + "•".repeat(Math.min(at - 1, 4)) + value.slice(at);
  }
  return value.slice(0, 2) + "•".repeat(Math.min(value.length - 4, 4)) + value.slice(-2);
}

export function BackupPanel() {
  const { accounts, settings, backup, profile, recordBackup, importAccounts } = useVault();

  // ── Export modal ──────────────────────────────────────────────────────────
  const [exportOpen, setExportOpen] = useState(false);
  const [exportPassword, setExportPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showExportPass, setShowExportPass] = useState(false);
  const [exportError, setExportError] = useState("");

  // ── Import wizard ─────────────────────────────────────────────────────────
  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>("select");
  const [importFileContent, setImportFileContent] = useState<string | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [importHeader, setImportHeader] = useState<BackupHeader | null>(null);
  const [importPassword, setImportPassword] = useState("");
  const [showImportPass, setShowImportPass] = useState(false);
  const [importError, setImportError] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [previewAccounts, setPreviewAccounts] = useState<VaultAccount[]>([]);
  const [importedCount, setImportedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Export handler ────────────────────────────────────────────────────────
  async function handleExportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!exportPassword) {
      setExportError("Password is required to encrypt your backup.");
      return;
    }
    if (exportPassword.length < 4) {
      setExportError("Password should be at least 4 characters.");
      return;
    }
    if (exportPassword !== confirmPassword) {
      setExportError("Passwords do not match.");
      return;
    }

    try {
      // profile: null — credentials must NEVER travel in a backup
      const payload = await createBackupPayloadAsync(
        { accounts, settings, backup, profile: null },
        exportPassword,
      );
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = BACKUP_FILENAME;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      recordBackup(BACKUP_FILENAME);
      setExportOpen(false);
      setExportPassword("");
      setConfirmPassword("");
      setExportError("");
      toast.success("Encrypted backup created", {
        description: `Saved as ${BACKUP_FILENAME}. Store this file safely.`,
      });
    } catch {
      toast.error("Export failed", { description: "Could not create the backup file." });
    }
  }

  // ── Import wizard helpers ─────────────────────────────────────────────────
  function resetImport() {
    setImportStep("select");
    setImportFileContent(null);
    setImportFileName("");
    setImportHeader(null);
    setImportPassword("");
    setShowImportPass(false);
    setImportError("");
    setPreviewAccounts([]);
    setImportedCount(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function openImportWizard() {
    resetImport();
    setImportOpen(true);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      try {
        const { version } = readBackupPayload(content);
        setImportFileContent(content);
        setImportHeader({ version });
        setImportError("");
        setImportStep("validate");
      } catch (err) {
        setImportError(
          err instanceof Error && err.message === "unsupported-version"
            ? "Unsupported backup format version."
            : "This file is corrupted or not a valid .aax backup.",
        );
        setImportStep("validate");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!importPassword) {
      setImportError("Enter the backup password.");
      return;
    }
    if (!importFileContent) return;

    setImportBusy(true);
    setImportError("");
    try {
      const restored = await openBackupPayloadAsync(importFileContent, importPassword);
      setPreviewAccounts(restored);
      setImportStep("preview");
    } catch {
      setImportError("Incorrect password — could not decrypt the backup.");
    } finally {
      setImportBusy(false);
    }
  }

  function handleConfirmImport() {
    const count = importAccounts(previewAccounts);
    setImportedCount(count);
    setImportStep("done");
    recordBackup(importFileName || BACKUP_FILENAME);
  }

  function closeImport() {
    setImportOpen(false);
    setTimeout(resetImport, 300);
  }

  // ── Step meta ─────────────────────────────────────────────────────────────
  const STEP_ORDER: ImportStep[] = ["select", "validate", "password", "preview", "confirm", "done"];
  const stepIndex = STEP_ORDER.indexOf(importStep);

  const STEP_LABELS: Record<ImportStep, string> = {
    select: "Select file",
    validate: "Verify header",
    password: "Enter password",
    preview: "Preview",
    confirm: "Confirm",
    done: "Done",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Protect your vault
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create an encrypted backup so you can restore your accounts if you lose this device.
        </p>
      </div>

      {/* Main Export / Import Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Export Card */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-border-strong">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HardDriveDownload className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Export encrypted backup</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Generates a password-encrypted <code className="font-mono text-primary">.aax</code>{" "}
              file containing all your TOTP secrets. Profile credentials are never included.
            </p>
          </div>
          <div className="mt-6">
            <Button
              onClick={() => setExportOpen(true)}
              disabled={accounts.length === 0}
              className="w-full h-10 gap-2 font-medium"
            >
              <HardDriveDownload className="h-4 w-4" />
              Export encrypted backup
            </Button>
            {accounts.length === 0 && (
              <p className="mt-1 text-[11px] text-muted-foreground text-center">
                Add at least one account to export.
              </p>
            )}
          </div>
        </div>

        {/* Import Card */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-border-strong">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <HardDriveUpload className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Import backup</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Restore accounts from an existing <code className="font-mono text-primary">.aax</code>{" "}
              backup file. A step-by-step wizard guides you through validation and decryption.
            </p>
          </div>
          <div className="mt-6">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".aax,.json"
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={openImportWizard}
              className="w-full h-10 gap-2 font-medium"
            >
              <HardDriveUpload className="h-4 w-4" />
              Import backup (.aax)
            </Button>
          </div>
        </div>
      </div>

      {/* Backup Status & Privacy Assurance */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">
              Privacy &amp; Security Guarantee
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Anoneurx never uploads backups to any server. Encryption happens locally. Profile
              credentials (passwords, pattern hashes) are stripped before export.
            </p>
          </div>
        </div>
        <div className="border-t border-border pt-4 grid gap-4 sm:grid-cols-2 text-xs">
          <div>
            <span className="text-muted-foreground">Backup Status:</span>
            <div className="mt-1 font-medium text-foreground flex items-center gap-1.5">
              {backup.lastBackupAt ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>
                    Last backup: {new Date(backup.lastBackupAt).toLocaleDateString()} at{" "}
                    {new Date(backup.lastBackupAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span>Last backup: Never</span>
                </>
              )}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Default Filename:</span>
            <div className="mt-1 font-mono text-foreground">{BACKUP_FILENAME}</div>
          </div>
        </div>
      </div>

      {/* ── Export Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <Lock className="h-5 w-5" />
              <DialogTitle>Encrypt Backup</DialogTitle>
            </div>
            <DialogDescription>
              Enter a strong password to protect your exported authenticator backup.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleExportSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="export-pass">Backup Password</Label>
              <div className="relative">
                <Input
                  id="export-pass"
                  type={showExportPass ? "text" : "password"}
                  placeholder="Enter encryption password"
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowExportPass(!showExportPass)}
                  aria-label={showExportPass ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showExportPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pass">Confirm Password</Label>
              <Input
                id="confirm-pass"
                type={showExportPass ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {exportError && <p className="text-xs font-medium text-destructive">{exportError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setExportOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2">
                <FileCheck className="h-4 w-4" />
                Export .aax file
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Import Wizard Dialog ──────────────────────────────────────────── */}
      <Dialog
        open={importOpen}
        onOpenChange={(open) => {
          if (!open) closeImport();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <HardDriveUpload className="h-5 w-5" />
              <DialogTitle>Import Backup</DialogTitle>
            </div>
            <DialogDescription>{STEP_LABELS[importStep]}</DialogDescription>
          </DialogHeader>

          {/* Step progress bar */}
          <div className="flex items-center gap-1 mt-1">
            {STEP_ORDER.filter((s) => s !== "done").map((s, i) => (
              <span
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all",
                  i <= stepIndex ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>

          {/* ── STEP: select ── */}
          {importStep === "select" && (
            <div className="mt-4 flex flex-col items-center gap-5 py-4 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                <FolderOpen className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Select your .aax backup file
                </p>
                <p className="text-xs text-muted-foreground">
                  The wizard will validate the file header, prompt for your password, and show a
                  safe preview before importing.
                </p>
              </div>
              <Button className="gap-2 w-full" onClick={() => fileInputRef.current?.click()}>
                <FolderOpen className="h-4 w-4" />
                Choose file…
              </Button>
            </div>
          )}

          {/* ── STEP: validate ── */}
          {importStep === "validate" && (
            <div className="mt-4 space-y-4">
              {importError ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
                    <AlertTriangle className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-semibold text-destructive">File validation failed</p>
                  <p className="text-xs text-muted-foreground">{importError}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-2 text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                    <ScanLine className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Header valid</p>
                  <div className="w-full rounded-lg border border-border bg-muted/30 p-3 text-left text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Format version</span>
                      <span className="font-mono font-semibold">
                        AAX v{importHeader?.version ?? 1}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-mono">
                        {importHeader?.createdAt
                          ? new Date(importHeader.createdAt).toLocaleString()
                          : "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File</span>
                      <span className="font-mono truncate max-w-[180px]">{importFileName}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    setImportError("");
                    setImportStep("select");
                    fileInputRef.current?.click();
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Choose another
                </Button>
                {!importError && (
                  <Button className="flex-1 gap-2" onClick={() => setImportStep("password")}>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP: password ── */}
          {importStep === "password" && (
            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <KeyRound className="h-7 w-7" />
                </div>
                <p className="text-sm font-semibold text-foreground">Enter backup password</p>
                <p className="text-xs text-muted-foreground">
                  The password you chose when you exported this file.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="import-pass">Backup Password</Label>
                <div className="relative">
                  <Input
                    id="import-pass"
                    type={showImportPass ? "text" : "password"}
                    placeholder="Enter backup password"
                    value={importPassword}
                    onChange={(e) => setImportPassword(e.target.value)}
                    className="pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowImportPass(!showImportPass)}
                    aria-label={showImportPass ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showImportPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {importError && <p className="text-xs font-medium text-destructive">{importError}</p>}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    setImportError("");
                    setImportStep("validate");
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" className="flex-1 gap-2" disabled={importBusy}>
                  {importBusy ? (
                    "Decrypting…"
                  ) : (
                    <>
                      Decrypt <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* ── STEP: preview ── */}
          {importStep === "preview" && (
            <div className="mt-4 space-y-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <ListChecks className="h-7 w-7" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {previewAccounts.length} account{previewAccounts.length !== 1 ? "s" : ""} found
                </p>
                <p className="text-xs text-muted-foreground">
                  Issuers and masked account IDs only — secrets are never shown.
                </p>
              </div>

              <div className="max-h-52 overflow-y-auto rounded-lg border border-border bg-muted/20 divide-y divide-border">
                {previewAccounts.map((acct, i) => (
                  <div
                    key={acct.id ?? i}
                    className="flex items-center justify-between px-3 py-2 text-xs"
                  >
                    <span className="font-semibold text-foreground truncate max-w-[120px]">
                      {acct.issuer}
                    </span>
                    <span className="font-mono text-muted-foreground truncate max-w-[140px]">
                      {maskAccount(acct.account)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setImportStep("password")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button className="flex-1 gap-2" onClick={() => setImportStep("confirm")}>
                  Looks good
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP: confirm ── */}
          {importStep === "confirm" && (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-warning/40 bg-warning/5 p-4 text-xs text-muted-foreground leading-relaxed space-y-1">
                <p className="font-semibold text-foreground">Before you import</p>
                <p>Duplicate accounts (same issuer + account ID) will be skipped automatically.</p>
                <p>Existing accounts in your vault will not be modified or deleted.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setImportStep("preview")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button className="flex-1 gap-2" onClick={handleConfirmImport}>
                  <CheckCircle2 className="h-4 w-4" />
                  Import accounts
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP: done ── */}
          {importStep === "done" && (
            <div className="mt-4 flex flex-col items-center gap-4 py-4 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <PartyPopper className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-foreground">Import complete!</p>
                <p className="text-xs text-muted-foreground">
                  {importedCount} new account{importedCount !== 1 ? "s" : ""} added to your vault.
                </p>
              </div>
              <Button className="gap-2 w-full" onClick={closeImport}>
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
