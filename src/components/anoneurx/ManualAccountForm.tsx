import { useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isValidSecret, normalizeSecret } from "@/lib/totp";
import type { NewAccountInput } from "@/store/vault";
import type { OtpAlgorithm, OtpDigits } from "@/lib/vault-types";

export function ManualAccountForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: NewAccountInput) => void;
  onCancel?: () => void;
}) {
  const [issuer, setIssuer] = useState("");
  const [account, setAccount] = useState("");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [algorithm, setAlgorithm] = useState<OtpAlgorithm>("SHA1");
  const [digits, setDigits] = useState<OtpDigits>(6);
  const [period, setPeriod] = useState<number>(30);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!issuer.trim()) {
      errs["issuer"] = "Service / Issuer name is required";
    }
    if (!account.trim()) {
      errs["account"] = "Account name or email is required";
    }
    const cleanSecret = normalizeSecret(secret);
    if (!cleanSecret) {
      errs["secret"] = "Secret key is required";
    } else if (!isValidSecret(cleanSecret)) {
      errs["secret"] = "Invalid Base32 secret key (must be at least 16 Base32 characters A-Z, 2-7)";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      issuer: issuer.trim(),
      account: account.trim(),
      secret: normalizeSecret(secret),
      algorithm,
      digits,
      period,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="issuer">Service / Issuer</Label>
        <Input
          id="issuer"
          placeholder="e.g. GitHub, Google, AWS"
          value={issuer}
          onChange={(e) => {
            setIssuer(e.target.value);
            if (errors["issuer"]) setErrors((prev) => ({ ...prev, issuer: "" }));
          }}
          className={errors["issuer"] ? "border-destructive focus-visible:ring-destructive" : ""}
          autoComplete="off"
        />
        {errors["issuer"] && <p className="text-xs font-medium text-destructive">{errors["issuer"]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="account">Username / Email</Label>
        <Input
          id="account"
          placeholder="e.g. user@example.com"
          value={account}
          onChange={(e) => {
            setAccount(e.target.value);
            if (errors["account"]) setErrors((prev) => ({ ...prev, account: "" }));
          }}
          className={errors["account"] ? "border-destructive focus-visible:ring-destructive" : ""}
          autoComplete="off"
        />
        {errors["account"] && <p className="text-xs font-medium text-destructive">{errors["account"]}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="secret">Secret key</Label>
          <span className="text-xs text-muted-foreground font-mono">Base32 format</span>
        </div>
        <div className="relative">
          <Input
            id="secret"
            type={showSecret ? "text" : "password"}
            placeholder="e.g. JBSWY3DPEHPK3PXP"
            value={secret}
            onChange={(e) => {
              setSecret(e.target.value);
              if (errors["secret"]) setErrors((prev) => ({ ...prev, secret: "" }));
            }}
            className={`font-mono pr-10 uppercase ${
              errors["secret"] ? "border-destructive focus-visible:ring-destructive" : ""
            }`}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showSecret ? "Hide secret key" : "Show secret key"}
          >
            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors["secret"] ? (
          <p className="flex items-center gap-1 text-xs font-medium text-destructive">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            {errors["secret"]}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Secrets remain encrypted locally on this device. Never share your secret key.
          </p>
        )}
      </div>

      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {showAdvanced ? "Hide advanced options" : "Show advanced options (SHA, Digits, Period)"}
        </button>

        {showAdvanced && (
          <div className="mt-3 grid grid-cols-3 gap-3 rounded-lg border border-border bg-surface p-3 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="algorithm" className="text-xs">
                Algorithm
              </Label>
              <Select
                value={algorithm}
                onValueChange={(val) => setAlgorithm(val as OtpAlgorithm)}
              >
                <SelectTrigger id="algorithm" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SHA1">SHA1</SelectItem>
                  <SelectItem value="SHA256">SHA256</SelectItem>
                  <SelectItem value="SHA512">SHA512</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="digits" className="text-xs">
                Digits
              </Label>
              <Select
                value={String(digits)}
                onValueChange={(val) => setDigits(Number(val) as OtpDigits)}
              >
                <SelectTrigger id="digits" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 Digits</SelectItem>
                  <SelectItem value="8">8 Digits</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="period" className="text-xs">
                Period
              </Label>
              <Select
                value={String(period)}
                onValueChange={(val) => setPeriod(Number(val))}
              >
                <SelectTrigger id="period" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="h-10">
            Cancel
          </Button>
        )}
        <Button type="submit" className="h-10 gap-2 font-medium">
          <KeyRound className="h-4 w-4" />
          Add account
        </Button>
      </div>
    </form>
  );
}
