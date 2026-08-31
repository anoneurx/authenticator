import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Smartphone,
  Trash2,
  Check,
  Copy,
  ShieldCheck,
  Edit3,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { secondsRemaining, formatCode } from "@/lib/totp";
import type { VaultAccount } from "@/lib/vault-types";
import { CountdownRing } from "./CountdownRing";
import { ServiceIcon } from "./ServiceIcon";
import { ConfirmDialog } from "./ConfirmDialog";
import { useTick } from "./useTick";
import { useTotpCode } from "./useTotpCode";
import { toast, notifySystem } from "@/lib/notify";
import { authenticateDeviceLock } from "@/lib/device-lock";

export function AccountDetailsDialog({
  account,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: {
  account: VaultAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: Partial<VaultAccount>) => void;
  onDelete: (id: string) => void;
}) {
  const now = useTick();
  const code = useTotpCode(
    account?.secret,
    account?.digits ?? 6,
    account?.period ?? 30,
    account?.algorithm ?? "SHA1",
    now,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [updateSignInOpen, setUpdateSignInOpen] = useState(false);

  // Edit fields
  const [editIssuer, setEditIssuer] = useState("");
  const [editAccount, setEditAccount] = useState("");
  const [editLabel, setEditLabel] = useState("");

  // Handle ESC key and disable body scroll when overlay is open
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!open || !account) return null;

  const remaining = secondsRemaining(account.period, now);
  const formattedCode = code ? formatCode(code) : "······";

  function handleClose() {
    onOpenChange(false);
  }

  async function copyCode() {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
      notifySystem("Code Copied", `${account.issuer} code copied to clipboard.`);
      toast.success("Verification Code Copied", {
        description: `${account.issuer} code (${formattedCode}) copied to clipboard. Refreshes in ${remaining}s.`,
      });
    } catch {
      toast.error("Couldn't copy the code");
    }
  }

  function handleOpenUpdateSignIn() {
    if (!account) return;
    setEditIssuer(account.issuer);
    setEditAccount(account.account);
    setEditLabel(account.label ?? "");
    setUpdateSignInOpen(true);
  }

  function handleSaveSignInDetails() {
    if (!account) return;
    onSave(account.id, {
      issuer: editIssuer.trim() || account.issuer,
      account: editAccount.trim() || account.account,
      ...(editLabel.trim() ? { label: editLabel.trim() } : {}),
    });
    setUpdateSignInOpen(false);
    toast.success("Sign-In details updated successfully");
  }

  return (
    <>
      {/* Blurred Backdrop Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Detail Sheet Container */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col max-w-2xl mx-auto bg-card border-t border-x border-border/80 rounded-t-3xl shadow-2xl overflow-hidden select-none animate-in slide-in-from-bottom duration-300 max-h-[85vh]">
        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto pb-5">
          {/* Account Hero Banner Card */}
          <div className="flex items-center gap-4 p-4">
            <ServiceIcon issuer={account.issuer} size="lg" />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-foreground truncate">{account.issuer}</h2>
              <p className="text-xs font-medium text-muted-foreground truncate">
                {account.account}
              </p>
            </div>
          </div>
          {/* One-Time Password Code Display */}
          <div
            onClick={copyCode}
            className="p-5 rounded-2xl border border-border/60 bg-card hover:bg-muted/30 transition-all cursor-pointer space-y-2 shadow-xs group"
          >
            <span className="text-xs font-semibold text-muted-foreground">
              One-time password code
            </span>
            <div className="flex items-center gap-4">
              <CountdownRing remaining={remaining} period={account.period} size={44} />
              <div className="flex-1">
                <p className="otp-digits text-3xl sm:text-4xl font-extrabold tracking-wider text-[#0078D4] dark:text-[#38BDF8]">
                  {copied ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-500 text-xl font-bold">
                      <Check className="h-6 w-6" /> Copied
                    </span>
                  ) : (
                    formattedCode
                  )}
                </p>
              </div>
              <Copy className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </div>
          </div>

          {/* Action Items List */}
          <div className="space-y-1 divide-y divide-border/30">
            {/* Update how you sign in or verify */}
            <button
              type="button"
              onClick={handleOpenUpdateSignIn}
              className="w-full flex items-center justify-between p-3.5 text-left rounded-xl hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  Update how you sign in or verify
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
            </button>

            {/* Delete account */}
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="w-full flex items-center justify-between p-3.5 text-left rounded-xl hover:bg-destructive/10 text-destructive transition-colors pt-3"
            >
              <div className="flex items-center gap-3.5">
                <Trash2 className="h-5 w-5" />
                <span className="text-sm font-semibold">Delete account from vault</span>
              </div>
              <ChevronRight className="h-5 w-5 opacity-60" />
            </button>
          </div>
        </div>
      </div>

      {/* Dialog for Updating Sign-In Details */}
      <Dialog open={updateSignInOpen} onOpenChange={setUpdateSignInOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-[5px] border border-border/80 bg-card p-5 space-y-4 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Edit3 className="h-5 w-5 text-primary" /> Update Sign-In Method
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify account identification and verification details for {account.issuer}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">
                Issuer / Brand Name
              </Label>
              <Input
                value={editIssuer}
                onChange={(e) => setEditIssuer(e.target.value)}
                className="mt-1 text-sm h-10 rounded-[5px]"
                placeholder="e.g. GitHub"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">
                Account Identifier / Email
              </Label>
              <Input
                value={editAccount}
                onChange={(e) => setEditAccount(e.target.value)}
                className="mt-1 text-sm h-10 rounded-[5px]"
                placeholder="e.g. user@example.com"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">
                Optional Label / Category
              </Label>
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="mt-1 text-sm h-10 rounded-[5px]"
                placeholder="e.g. Work Account"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUpdateSignInOpen(false)}
                className="rounded-[5px] text-xs h-9 px-4"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveSignInDetails}
                className="rounded-[5px] text-xs h-9 px-4"
              >
                Save Details
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Deleting Account */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${account.issuer}?`}
        destructive
        confirmLabel="Authenticate & Delete"
        description={
          <>
            <p>This will remove this 2FA entry from your device vault.</p>
            <p>
              Device lock / Passkey confirmation is required to proceed with deletion.
            </p>
          </>
        }
        onConfirm={async () => {
          const verified = await authenticateDeviceLock(`delete ${account.issuer}`);
          if (!verified) return;

          onDelete(account.id);
          setDeleteOpen(false);
          handleClose();
          toast.success("Account deleted from vault");
        }}
      />
    </>
  );
}
