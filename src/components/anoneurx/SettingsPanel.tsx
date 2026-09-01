import { useState } from "react";
import {
  Sun,
  Moon,
  Laptop,
  Shield,
  HardDriveDownload,
  HardDriveUpload,
  Info,
  ExternalLink,
  Lock,
  Fingerprint,
  AlertTriangle,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  FileDown,
  CheckCircle2,
  BellRing,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVault } from "@/store/vault";
import {
  AUTO_LOCK_LABELS,
  type AutoLockDelay,
  type ThemePreference,
} from "@/lib/vault-types";
import { BACKUP_FILENAME, createBackupPayloadAsync } from "@/lib/vault-storage";
import {
  verifySecret,
  hashSecret,
  createSalt,
  passwordStrength,
  type UnlockMethod,
} from "@/lib/identity";
import { biometricAvailability, authenticateBiometric } from "@/lib/biometric";
import {
  disableSystemNotifications,
  enableSystemNotifications,
  getNotificationPermission,
  systemNotificationsActive,
  systemNotificationsSupported,
} from "@/lib/notify";
import { BrandMark } from "./BrandMark";
import { AboutScreen } from "./AboutScreen";
import { Link } from "@tanstack/react-router";
import { toast } from "@/lib/notify";
import { Capacitor } from "@capacitor/core";

async function saveBackupNative(
  payload: string,
  filename: string,
): Promise<{ saved: boolean; location?: string }> {
  if (!Capacitor.isNativePlatform()) return { saved: false };
  try {
    const { Filesystem, Directory, Encoding } =
      await import("@capacitor/filesystem");

    // Request filesystem permissions first (required on Android 9 and below)
    try {
      await Filesystem.requestPermissions();
    } catch {
      /* permission API may not exist on all platforms */
    }

    const folder = "Authenticator";

    // Try directories in order of user-accessibility
    const dirCandidates: {
      dir: (typeof Directory)[keyof typeof Directory];
      label: string;
    }[] = [
      { dir: Directory.ExternalStorage, label: "ExternalStorage" },
      { dir: Directory.Documents, label: "Documents" },
      { dir: Directory.Data, label: "Data" },
    ];

    for (const { dir, label } of dirCandidates) {
      try {
        try {
          await Filesystem.mkdir({
            path: folder,
            directory: dir,
            recursive: true,
          });
        } catch {
          /* already exists */
        }

        await Filesystem.writeFile({
          path: `${folder}/${filename}`,
          data: payload,
          directory: dir,
          encoding: Encoding.UTF8,
        });

        const locationMap: Record<string, string> = {
          ExternalStorage: `Storage/${folder}/${filename}`,
          Documents: `Documents/${folder}/${filename}`,
          Data: `App Data/${folder}/${filename}`,
        };
        return {
          saved: true,
          location: locationMap[label] ?? `${label}/${folder}/${filename}`,
        };
      } catch {
        // Try next directory
        continue;
      }
    }

    return { saved: false };
  } catch {
    return { saved: false };
  }
}

function downloadBlobWeb(payload: string, filename: string) {
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function SettingsPanel() {
  const {
    settings,
    updateSettings,
    accounts,
    backup,
    profile,
    recordBackup,
    deleteVaultProfile,
    setUnlockMethods,
  } = useVault();
  const [activeInfoModal, setActiveInfoModal] = useState<
    "privacy" | "security" | "opensource" | null
  >(null);
  const [showAbout, setShowAbout] = useState(false);

  // ── Direct Export Vault modal state ────────────────────────────────────
  const [exportOpen, setExportOpen] = useState(false);
  const [exportPassword, setExportPassword] = useState("");
  const [exportConfirm, setExportConfirm] = useState("");
  const [showExportPass, setShowExportPass] = useState(false);
  const [exportError, setExportError] = useState("");
  const [exportBusy, setExportBusy] = useState(false);

  async function handleDirectExport() {
    if (!exportPassword) {
      setExportError("Choose a password to encrypt your backup file.");
      return;
    }
    if (exportPassword.length < 4) {
      setExportError("Backup password must be at least 4 characters.");
      return;
    }
    if (exportPassword !== exportConfirm) {
      setExportError("Backup passwords do not match.");
      return;
    }
    setExportBusy(true);
    try {
      const payload = await createBackupPayloadAsync(
        { accounts, settings, backup, profile: null },
        exportPassword,
      );

      if (Capacitor.isNativePlatform()) {
        const result = await saveBackupNative(payload, BACKUP_FILENAME);
        if (result.saved) {
          toast.success("Encrypted backup saved", {
            description: `Saved to ${result.location ?? "device storage"}`,
          });
        } else {
          setExportError("Could not save backup file. Please try again.");
          return;
        }
      } else {
        downloadBlobWeb(payload, BACKUP_FILENAME);
        toast.success("Encrypted backup downloaded", {
          description: `Saved as ${BACKUP_FILENAME}. Keep it somewhere safe.`,
        });
      }

      recordBackup(BACKUP_FILENAME);
      setExportError("");
      setExportOpen(false);
      setExportPassword("");
      setExportConfirm("");
    } catch {
      setExportError("Could not create the backup file. Please try again.");
    } finally {
      setExportBusy(false);
    }
  }

  // ── Change master password ─────────────────────────────────────────────
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showChangePass, setShowChangePass] = useState(false);
  const [changePassError, setChangePassError] = useState("");
  const [changePassBusy, setChangePassBusy] = useState(false);
  const [changePassDone, setChangePassDone] = useState(false);

  // ── Biometric unlock ──────────────────────────────────────────────────────
  const [biometricBusy, setBiometricBusy] = useState(false);

  async function handleToggleBiometric(checked: boolean) {
    if (biometricBusy) return;
    if (!checked) {
      updateSettings({ biometricUnlock: false });
      updateProfileUnlock(false);
      toast.success("Biometric unlock disabled", {
        description: "You'll use your master password to unlock the vault.",
      });
      return;
    }

    setBiometricBusy(true);
    try {
      const bio = await biometricAvailability();
      if (!bio.available) {
        toast.error("Biometrics not available", {
          description:
            "This device has no enrolled fingerprint, face or iris. Set one up in your system settings.",
        });
        return;
      }
      const confirmed = await authenticateBiometric(
        "Confirm your biometric / device passkey to enable biometric unlock",
      );
      if (!confirmed) {
        toast.error("Biometric unlock not enabled", {
          description: "Confirmation was canceled or failed.",
        });
        return;
      }
      updateSettings({ biometricUnlock: true });
      updateProfileUnlock(true);
      toast.success("Biometric unlock enabled", {
        description:
          "Confirm your fingerprint, Face ID or passkey when the vault asks to unlock.",
      });
    } finally {
      setBiometricBusy(false);
    }
  }

  function updateProfileUnlock(enable: boolean) {
    const existing = profile?.enabledUnlock ?? ([] as UnlockMethod[]);
    const next = existing.filter((m) => m !== "biometric") as UnlockMethod[];
    if (enable) next.push("biometric");
    setUnlockMethods(next);
  }

  // ── System notifications (device notification center) ───────────────────
  const [sysNotifOn, setSysNotifOn] = useState(() =>
    systemNotificationsActive(),
  );
  const permission = getNotificationPermission();
  const notifHint = !systemNotificationsSupported()
    ? "Not supported in this browser — in-app alerts will be used."
    : permission === "denied"
      ? "Blocked — allow notifications in your browser settings."
      : sysNotifOn
        ? "Events are delivered to your device notification center."
        : "Show events in your device notification center instead of on-screen.";

  async function handleToggleSystemNotifications(checked: boolean) {
    if (checked) {
      const granted = await enableSystemNotifications();
      setSysNotifOn(granted);
      if (granted) {
        toast.success("System notifications enabled", {
          description: "Alerts now appear in your device notification center.",
        });
      } else {
        toast.error("Couldn't enable system notifications", {
          description:
            "Permission was blocked. Allow it in your browser settings and retry.",
        });
      }
    } else {
      disableSystemNotifications();
      setSysNotifOn(false);
      toast.success("In-app notifications restored");
    }
  }

  // ── Delete account flow ──────────────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"password" | "backup">(
    "password",
  );
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePass, setShowDeletePass] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [backupPassword, setBackupPassword] = useState("");
  const [backupConfirm, setBackupConfirm] = useState("");
  const [showBackupPass, setShowBackupPass] = useState(false);
  const [backupDownloaded, setBackupDownloaded] = useState(false);

  function openDeleteFlow() {
    setDeleteStep("password");
    setDeletePassword("");
    setDeleteError("");
    setBackupPassword("");
    setBackupConfirm("");
    setBackupDownloaded(false);
    setDeleteOpen(true);
  }

  async function handleVerifyPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || deleteBusy) return;
    if (!deletePassword) {
      setDeleteError("Enter your master password to continue.");
      return;
    }
    setDeleteBusy(true);
    try {
      const ok = await verifySecret(
        deletePassword,
        profile.salt,
        profile.passwordHash,
      );
      if (!ok) {
        setDeleteError("Incorrect master password. Please try again.");
        return;
      }
      setDeleteError("");
      setDeleteStep("backup");
    } finally {
      setDeleteBusy(false);
    }
  }

  async function handleDownloadBackup() {
    if (!backupPassword) {
      setDeleteError("Choose a password to encrypt your backup file.");
      return;
    }
    if (backupPassword.length < 4) {
      setDeleteError("Backup password must be at least 4 characters.");
      return;
    }
    if (backupPassword !== backupConfirm) {
      setDeleteError("Backup passwords do not match.");
      return;
    }
    setDeleteBusy(true);
    try {
      const payload = await createBackupPayloadAsync(
        { accounts, settings, backup, profile: null },
        backupPassword,
      );

      if (Capacitor.isNativePlatform()) {
        const result = await saveBackupNative(payload, BACKUP_FILENAME);
        if (result.saved) {
          toast.success("Encrypted backup saved", {
            description: `Saved to ${result.location ?? "device storage"}`,
          });
        } else {
          setDeleteError("Could not save backup file. Please try again.");
          return;
        }
      } else {
        downloadBlobWeb(payload, BACKUP_FILENAME);
        toast.success("Encrypted backup downloaded", {
          description: `Saved as ${BACKUP_FILENAME}. Keep it somewhere safe.`,
        });
      }

      recordBackup(BACKUP_FILENAME);
      setBackupDownloaded(true);
      setDeleteError("");
    } catch {
      setDeleteError("Could not create the backup file. Please try again.");
    } finally {
      setDeleteBusy(false);
    }
  }

  function handleFinalDelete() {
    deleteVaultProfile();
    setDeleteOpen(false);
    toast.success("Account deleted", {
      description: "Your vault has been wiped from this device.",
    });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Settings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize theme, security preferences, and view system information.
        </p>
      </div>

      {/* Appearance Section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 HAIRLINE">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sun className="h-4 w-4 text-primary" />
          Appearance
        </h3>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="space-y-0.5">
            <Label htmlFor="theme-select" className="text-sm font-medium">
              Theme Mode
            </Label>
            <p className="text-xs text-muted-foreground">
              Select your preferred visual style.
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
            <Button
              variant={settings.theme === "system" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                updateSettings({ theme: "system" });
                toast.success("Theme set to System");
              }}
              className="h-8 text-xs gap-1.5 px-3"
            >
              <Laptop className="h-3.5 w-3.5" />
              System
            </Button>
            <Button
              variant={settings.theme === "dark" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                updateSettings({ theme: "dark" });
                toast.success("Theme set to Dark");
              }}
              className="h-8 text-xs gap-1.5 px-3"
            >
              <Moon className="h-3.5 w-3.5" />
              Dark
            </Button>
            <Button
              variant={settings.theme === "light" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                updateSettings({ theme: "light" });
                toast.success("Theme set to Light");
              }}
              className="h-8 text-xs gap-1.5 px-3"
            >
              <Sun className="h-3.5 w-3.5" />
              Light
            </Button>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 HAIRLINE">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Security Preferences
        </h3>

        <div className="space-y-4 pt-1">
          {/* Require Authentication on Launch */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5 min-w-0">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Require Authentication on Launch
              </Label>
              <p className="text-xs text-muted-foreground">
                Prompt for master password verification whenever app opens
              </p>
            </div>
            <Switch
              checked={settings.requireAuthOnLaunch}
              onCheckedChange={(checked) => {
                updateSettings({ requireAuthOnLaunch: checked });
                toast.success(
                  checked
                    ? "Authentication required on app launch"
                    : "Launch authentication disabled",
                );
              }}
            />
          </div>

          <div className="border-t border-border" />

          {/* Biometric unlock */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5 min-w-0">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-muted-foreground" />
                Biometric Unlock
              </Label>
              <p className="text-xs text-muted-foreground">
                {biometricBusy
                  ? "Confirming with your device prompt…"
                  : "Unlock with fingerprint, Face ID or device passkey"}
              </p>
            </div>
            <Switch
              checked={settings.biometricUnlock}
              disabled={biometricBusy}
              onCheckedChange={(checked) => void handleToggleBiometric(checked)}
            />
          </div>

          <div className="border-t border-border" />

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Auto-lock Timeout
              </Label>
              <p className="text-xs text-muted-foreground">
                Inactivity period before locking
              </p>
            </div>
            <Select
              value={settings.autoLock}
              onValueChange={(val) =>
                updateSettings({ autoLock: val as AutoLockDelay })
              }
            >
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(AUTO_LOCK_LABELS) as AutoLockDelay[]).map(
                  (key) => (
                    <SelectItem key={key} value={key}>
                      {AUTO_LOCK_LABELS[key]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t border-border" />

          {/* System notifications (device notification center) */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5 min-w-0">
              <Label className="text-sm font-medium flex items-center gap-2">
                <BellRing className="h-4 w-4 text-muted-foreground" />
                System Notifications
              </Label>
              <p className="text-xs text-muted-foreground">{notifHint}</p>
            </div>
            <Switch
              checked={sysNotifOn}
              disabled={!systemNotificationsSupported()}
              onCheckedChange={(checked) =>
                void handleToggleSystemNotifications(checked)
              }
            />
          </div>

          <div className="border-t border-border" />

          {/* About screen shortcut */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5 min-w-0">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                About This App
              </Label>
              <p className="text-xs text-muted-foreground">
                Version, security model and privacy details
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAbout(true)}
              className="h-9 shrink-0 gap-2 text-xs"
            >
              <BrandMark className="h-3.5 w-3.5 text-primary" />
              Open
            </Button>
          </div>
        </div>
      </div>

      {/* Data Section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 HAIRLINE">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <HardDriveDownload className="h-4 w-4 text-primary" />
          Vault Data Management
        </h3>
        <p className="text-xs text-muted-foreground">
          Directly export an encrypted backup of your authenticator vault file.
        </p>

        <div className="pt-1">
          <Button
            onClick={() => {
              setExportError("");
              setExportPassword("");
              setExportConfirm("");
              setExportOpen(true);
            }}
            className="h-9 gap-2 text-xs font-semibold"
          >
            <HardDriveDownload className="h-3.5 w-3.5" />
            Export Encrypted Backup (.aax)
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Danger Zone
        </h3>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5 min-w-0">
            <Label className="text-sm font-medium">Delete account</Label>
            <p className="text-xs text-muted-foreground">
              Verify your password, save an encrypted backup, then permanently
              wipe this vault from the device.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={openDeleteFlow}
            className="h-9 gap-2 text-xs shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete account
          </Button>
        </div>
      </div>

      {/* Full-screen About overlay */}
      {showAbout && <AboutScreen onClose={() => setShowAbout(false)} />}

      {/* Information Dialogs */}
      <Dialog
        open={activeInfoModal !== null}
        onOpenChange={() => setActiveInfoModal(null)}
      >
        <DialogContent className="sm:max-w-md">
          <div className="text-xs text-muted-foreground space-y-3 py-2 leading-relaxed">
            {activeInfoModal === "privacy" && (
              <>
                <p>
                  Authenticator operates entirely on your device. No analytics,
                  tracking pixels, or third-party telemetries exist in this
                  application.
                </p>
                <p>
                  Your TOTP secrets never leave local device storage and are
                  never uploaded to any remote service.
                </p>
              </>
            )}

            {activeInfoModal === "security" && (
              <>
                <p>
                  Secrets are stored locally using encrypted key-value storage
                  abstractions. When exported, backups are sealed using
                  client-side encryption.
                </p>
                <p>
                  This architecture is designed to interface with local security
                  hardware or a Rust security core.
                </p>
              </>
            )}

            {activeInfoModal === "opensource" && (
              <>
                <p>
                  Authenticator frontend is built with open, inspectable web
                  components (React, Vite, TypeScript, Tailwind CSS).
                </p>
                <p>
                  You can inspect all code and verify that zero network fetch
                  calls are made during application lifecycle.
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete Account Flow */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {deleteStep === "password" ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-destructive" />
                  Verify it&apos;s you
                </DialogTitle>
                <DialogDescription>
                  Enter your master password to begin account deletion.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={(e) => void handleVerifyPassword(e)}
                className="space-y-4 pt-1"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs">Master password</Label>
                  <div className="relative">
                    <Input
                      type={showDeletePass ? "text" : "password"}
                      value={deletePassword}
                      onChange={(e) => {
                        setDeletePassword(e.target.value);
                        if (deleteError) setDeleteError("");
                      }}
                      placeholder="Your master password"
                      className="h-10 pr-10 text-sm"
                      autoFocus
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeletePass(!showDeletePass)}
                      aria-label={
                        showDeletePass ? "Hide password" : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showDeletePass ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {deleteError && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {deleteError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteOpen(false)}
                    className="h-9 px-4 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    disabled={deleteBusy}
                    className="h-9 gap-2 px-4 text-xs"
                  >
                    {deleteBusy && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    Continue
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileDown className="h-5 w-5 text-primary" />
                  Take a backup first
                </DialogTitle>
                <DialogDescription>
                  Deleting removes every code from this device forever. Download
                  an encrypted <span className="font-mono">.aax</span> backup so
                  you can restore later.
                </DialogDescription>
              </DialogHeader>

              {!backupDownloaded ? (
                <div className="space-y-4 pt-1">
                  <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3.5">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Backup password</Label>
                      <div className="relative">
                        <Input
                          type={showBackupPass ? "text" : "password"}
                          value={backupPassword}
                          onChange={(e) => {
                            setBackupPassword(e.target.value);
                            if (deleteError) setDeleteError("");
                          }}
                          placeholder="Encrypts the backup file"
                          className="h-10 pr-10 text-sm"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowBackupPass(!showBackupPass)}
                          aria-label={
                            showBackupPass ? "Hide password" : "Show password"
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {showBackupPass ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Confirm backup password</Label>
                      <Input
                        type={showBackupPass ? "text" : "password"}
                        value={backupConfirm}
                        onChange={(e) => {
                          setBackupConfirm(e.target.value);
                          if (deleteError) setDeleteError("");
                        }}
                        placeholder="Repeat backup password"
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>

                  {deleteError && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      {deleteError}
                    </p>
                  )}

                  <Button
                    onClick={() => void handleDownloadBackup()}
                    disabled={deleteBusy}
                    className="h-10 w-full gap-2 text-sm font-semibold"
                  >
                    {deleteBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <HardDriveDownload className="h-4 w-4" />
                    )}
                    Download encrypted backup (.aax)
                  </Button>

                  <button
                    type="button"
                    onClick={() => setBackupDownloaded(true)}
                    className="w-full text-center text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-destructive hover:underline"
                  >
                    Skip backup — I understand the risk
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <div className="space-y-0.5 text-xs leading-relaxed">
                      <p className="font-semibold text-foreground">
                        Backup saved as {BACKUP_FILENAME}
                      </p>
                      <p className="text-muted-foreground">
                        You can import this file from the Backup screen on any
                        device to restore your codes.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3.5 text-xs leading-relaxed text-foreground">
                    <p className="font-semibold">Final warning</p>
                    <p className="mt-1 text-muted-foreground">
                      This permanently deletes your account and every
                      authenticator entry from this device. This cannot be
                      undone.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteOpen(false)}
                      className="h-9 px-4 text-xs"
                    >
                      Keep my account
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleFinalDelete}
                      className="h-9 gap-2 px-4 text-xs font-semibold"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete everything
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Backup Modal */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HardDriveDownload className="h-5 w-5 text-primary" />
              Export Encrypted Backup
            </DialogTitle>
            <DialogDescription>
              Set a password to encrypt your{" "}
              <span className="font-mono">.aax</span> backup file.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs">Backup password</Label>
                <div className="relative">
                  <Input
                    type={showExportPass ? "text" : "password"}
                    value={exportPassword}
                    onChange={(e) => {
                      setExportPassword(e.target.value);
                      if (exportError) setExportError("");
                    }}
                    placeholder="Encrypts the backup file"
                    className="h-10 pr-10 text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowExportPass(!showExportPass)}
                    aria-label={
                      showExportPass ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showExportPass ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Confirm backup password</Label>
                <Input
                  type={showExportPass ? "text" : "password"}
                  value={exportConfirm}
                  onChange={(e) => {
                    setExportConfirm(e.target.value);
                    if (exportError) setExportError("");
                  }}
                  placeholder="Repeat backup password"
                  className="h-10 text-sm"
                />
              </div>
            </div>

            {exportError && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {exportError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExportOpen(false)}
                className="h-9 px-4 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleDirectExport()}
                disabled={exportBusy}
                className="h-9 gap-2 px-4 text-xs font-semibold"
              >
                {exportBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <HardDriveDownload className="h-3.5 w-3.5" />
                )}
                Download Backup (.aax)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
