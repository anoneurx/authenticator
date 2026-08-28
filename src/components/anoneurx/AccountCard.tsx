import { secondsRemaining, formatCode } from "@/lib/totp";
import type { VaultAccount } from "@/lib/vault-types";
import { CountdownRing } from "./CountdownRing";
import { ServiceIcon } from "./ServiceIcon";
import { useTotpCode } from "./useTotpCode";

export function AccountCard({
  account,
  now,
  onOpen,
}: {
  account: VaultAccount;
  now: number;
  onOpen: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const code = useTotpCode(account.secret, account.digits, account.period, account.algorithm, now);
  const remaining = secondsRemaining(account.period, now);
  const formattedCode = code ? formatCode(code) : "······";

  return (
    <div
      onClick={onOpen}
      className="group relative flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-3.5 sm:p-4 pl-5 transition-all hover:bg-muted/40 hover:border-border cursor-pointer select-none overflow-hidden shadow-xs active:scale-[0.99]"
      title={`Open details for ${account.issuer}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      {/* Left Blue Vertical Accent Stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0078D4]" />

      {/* Left: Service Icon & Account Info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <ServiceIcon issuer={account.issuer} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="truncate text-sm sm:text-base font-bold text-foreground tracking-tight">
              {account.issuer}
            </h3>
            {account.label && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider shrink-0">
                {account.label}
              </span>
            )}
          </div>
          <p className="truncate text-xs font-medium text-muted-foreground">{account.account}</p>
        </div>
      </div>

      {/* Right: Code, Timer Ring */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="otp-digits text-lg sm:text-2xl font-bold tracking-wider text-[#0078D4] dark:text-[#38BDF8]">
            {formattedCode}
          </p>
        </div>

        {/* Small Circular Countdown Ring */}
        <CountdownRing remaining={remaining} period={account.period} size={30} />
      </div>
    </div>
  );
}
