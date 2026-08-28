import { cn } from "@/lib/utils";
import { formatCode } from "@/lib/totp";

export function OTPDisplay({
  code,
  size = "md",
  className,
}: {
  code: string;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "otp-digits text-foreground",
        size === "md" && "text-[2rem] leading-none sm:text-4xl",
        size === "lg" && "text-5xl leading-none sm:text-6xl",
        className,
      )}
      aria-label={`Verification code ${code.split("").join(" ")}`}
    >
      <span aria-hidden="true">{formatCode(code)}</span>
    </p>
  );
}
