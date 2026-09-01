import { useState } from "react";
import { QrCode, KeyRound, Shield, AlertTriangle, Tag, Check, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QRScanner } from "./QRScanner";
import { ManualAccountForm } from "./ManualAccountForm";
import { ServiceIcon } from "./ServiceIcon";
import { useVault, type NewAccountInput } from "@/store/vault";
import { parseOtpAuthUri } from "@/lib/totp";
import { registerPasskey } from "@/lib/webauthn";
import { toast } from "@/lib/notify";

export function AddAccountModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addAccount } = useVault();
  const [activeTab, setActiveTab] = useState<"qr" | "manual">("qr");
  const [invalidQrMessage, setInvalidQrMessage] = useState<string | null>(null);

  // Pending account step (Step 2: select Personal / Work label before saving)
  const [pendingAccount, setPendingAccount] = useState<NewAccountInput | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<"Personal" | "Work" | "Custom">("Personal");
  const [customLabelText, setCustomLabelText] = useState("");

  // Passkey confirmation step
  const [passkeyPending, setPasskeyPending] = useState<boolean | null>(null);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  function handleQrScan(uri: string) {
    if (!uri || !uri.trim()) {
      setInvalidQrMessage("The scanned QR code is empty or unreadable.");
      return;
    }
    try {
      const parsed = parseOtpAuthUri(uri);
      // Move to Step 2: Confirmation & Labeling
      setPendingAccount({
        issuer: parsed.issuer,
        account: parsed.account || "Account",
        secret: parsed.secret,
        algorithm: (parsed.algorithm as "SHA1" | "SHA256" | "SHA512") || "SHA1",
        digits: (parsed.digits as 6 | 8) || 6,
        period: parsed.period || 30,
        label: "Personal",
      });
      setSelectedLabel("Personal");
      setCustomLabelText("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid or unsupported QR code format.";
      setInvalidQrMessage(message);
    }
  }

  function handleManualSubmit(input: NewAccountInput) {
    setPendingAccount(input);
    setSelectedLabel(input.label === "Work" ? "Work" : "Personal");
    setCustomLabelText(
      input.label && input.label !== "Personal" && input.label !== "Work" ? input.label : "",
    );
  }

  async function handleConfirmSave() {
    if (!pendingAccount) return;
    const finalLabel =
      selectedLabel === "Custom" ? customLabelText.trim() || "Account" : selectedLabel;

    try {
      // Step: Register passkey confirmation
      setPasskeyPending(true);
      setPasskeyError(null);
      const passkeySuccess = await registerPasskey(pendingAccount.issuer || "User", pendingAccount.issuer || "Authenticator");
      setPasskeyPending(false);

      if (!passkeySuccess) {
        setPasskeyError("Passkey registration failed. Please try again.");
        return;
      }

      // Get the passkey credential ID that was just registered
      const credKey = "anoneurx.passkey.credentialId";
      const passkeyId =
        typeof window !== "undefined" ? window.localStorage.getItem(credKey) : null;

      try {
        const newAcc = addAccount({
          ...pendingAccount,
          label: finalLabel,
          ...(passkeyId ? { passkeyId } : {}),
        });
        toast.success("Account Added to Vault", {
          description: `${newAcc.issuer} (${newAcc.account}) tagged as '${finalLabel}' is now active on your dashboard.`,
        });
        setPendingAccount(null);
        onOpenChange(false);
      } catch {
        toast.error("Failed to add account", {
          description: "An error occurred while saving to your local vault.",
        });
      }
    } catch {
      setPasskeyPending(false);
      setPasskeyError("An unexpected error occurred during passkey registration.");
    }
  }

  function handleModalClose(isOpen: boolean) {
    if (!isOpen) {
      setPendingAccount(null);
      setInvalidQrMessage(null);
    }
    onOpenChange(isOpen);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleModalClose}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-[5px] border border-border/80 bg-card p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
          {!pendingAccount ? (
            /* Step 1: Scanner / Manual Input */
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 text-primary">
                  <Shield className="h-5 w-5" />
                  <DialogTitle className="text-base font-bold">Add Account</DialogTitle>
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Scan a 2FA QR code or enter your secret key manually.
                </DialogDescription>
              </DialogHeader>

              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "qr" | "manual")}
                className="mt-2"
              >
                <TabsList className="grid w-full grid-cols-2 rounded-[5px]">
                  <TabsTrigger value="qr" className="flex items-center gap-2 text-xs rounded-[5px]">
                    <QrCode className="h-4 w-4" />
                    Scan QR code
                  </TabsTrigger>
                  <TabsTrigger
                    value="manual"
                    className="flex items-center gap-2 text-xs rounded-[5px]"
                  >
                    <KeyRound className="h-4 w-4" />
                    Manual entry
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="qr" className="mt-4">
                  <QRScanner onDetected={handleQrScan} onManual={() => setActiveTab("manual")} />
                </TabsContent>

                <TabsContent value="manual" className="mt-4">
                  <ManualAccountForm
                    onSubmit={handleManualSubmit}
                    onCancel={() => handleModalClose(false)}
                  />
                </TabsContent>
              </Tabs>
            </>
          ) : (
            /* Step 2: Confirm Account & Select Label (Personal / Work) */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingAccount(null)}
                  className="h-8 w-8 p-0 rounded-[5px]"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <DialogTitle className="text-base font-bold">Account Detected</DialogTitle>
                  <p className="text-xs text-muted-foreground">
                    Confirm details & select account category.
                  </p>
                </div>
              </div>

              {/* Service Hero Card */}
              <div className="flex items-center gap-3.5 p-4 rounded-xl bg-muted/40 border border-border/60">
                <ServiceIcon issuer={pendingAccount.issuer} size="lg" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-foreground truncate">
                    {pendingAccount.issuer}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">{pendingAccount.account}</p>
                </div>
              </div>

              {/* Account Label Selector */}
              <div className="space-y-2.5 pt-1">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  Account Tag / Category Label
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLabel("Personal")}
                    className={`py-2 px-3 rounded-[5px] text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                      selectedLabel === "Personal"
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/30 hover:bg-muted/60 border-border/60 text-foreground"
                    }`}
                  >
                    {selectedLabel === "Personal" && <Check className="h-3.5 w-3.5" />}
                    Personal
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedLabel("Work")}
                    className={`py-2 px-3 rounded-[5px] text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                      selectedLabel === "Work"
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/30 hover:bg-muted/60 border-border/60 text-foreground"
                    }`}
                  >
                    {selectedLabel === "Work" && <Check className="h-3.5 w-3.5" />}
                    Work
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedLabel("Custom")}
                    className={`py-2 px-3 rounded-[5px] text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                      selectedLabel === "Custom"
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/30 hover:bg-muted/60 border-border/60 text-foreground"
                    }`}
                  >
                    {selectedLabel === "Custom" && <Check className="h-3.5 w-3.5" />}
                    Custom
                  </button>
                </div>

                {selectedLabel === "Custom" && (
                  <Input
                    value={customLabelText}
                    onChange={(e) => setCustomLabelText(e.target.value)}
                    placeholder="e.g. Account 2, Gaming, Client"
                    className="mt-2 text-xs h-9 rounded-[5px]"
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingAccount(null)}
                  className="rounded-[5px] text-xs h-9 px-4"
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmSave}
                  className="rounded-[5px] text-xs h-9 px-5 font-bold"
                >
                  Add Account to Vault
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invalid QR Code Notification Popup */}
      <Dialog open={!!invalidQrMessage} onOpenChange={(v) => !v && setInvalidQrMessage(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-[5px] border border-destructive/50 bg-card p-5 shadow-2xl space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <DialogTitle className="text-base font-bold">Invalid QR Code</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1 leading-relaxed">
              {invalidQrMessage}
            </DialogDescription>
          </DialogHeader>

          <div className="text-xs text-muted-foreground bg-destructive/10 border border-destructive/20 rounded-[5px] p-3">
            Please scan an <strong>otpauth://</strong> 2FA authenticator QR code provided by your
            service, or enter the secret key manually.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setInvalidQrMessage(null);
                setActiveTab("manual");
              }}
              className="rounded-[5px] text-xs h-9 px-3"
            >
              Manual Key
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setInvalidQrMessage(null)}
              className="rounded-[5px] text-xs h-9 px-4"
            >
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
