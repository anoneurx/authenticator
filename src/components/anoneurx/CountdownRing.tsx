import { cn } from "@/lib/utils";

interface Props {
  remaining: number;
  period: number;
  size?: number;
  className?: string;
}

export function CountdownRing({ remaining, period, size = 44, className }: Props) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, remaining / period));
  const urgent = remaining <= 5;

  return (
    <div
      className={cn("relative grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      role="timer"
      aria-live="off"
      aria-label={`Code refreshes in ${remaining} seconds`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="3"
          className="stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className={cn(
            "transition-[stroke-dashoffset] duration-1000 ease-linear",
            urgent ? "stroke-warning" : "stroke-primary",
          )}
        />
      </svg>
      <span
        className={cn(
          "absolute otp-digits text-[11px] tabular-nums",
          urgent ? "text-warning" : "text-muted-foreground",
        )}
      >
        {remaining}
      </span>
    </div>
  );
}

export function CountdownDots({ remaining, period }: { remaining: number; period: number }) {
  const total = 12;
  const active = Math.ceil((remaining / period) * total);
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full transition-colors",
            i < active
              ? remaining <= 5
                ? "bg-warning"
                : "bg-primary"
              : "bg-border-strong",
          )}
        />
      ))}
    </div>
  );
}
