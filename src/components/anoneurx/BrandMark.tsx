import { cn } from "@/lib/utils";

/** Geometric Anoneurx shield mark. */
export function BrandMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Anoneurx"
      className={cn("shrink-0", className)}
    >
      <path
        d="M16 2.5 28 7v10.2c0 6.3-4.7 10.9-12 12.3C8.7 28.1 4 23.5 4 17.2V7l12-4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M16 9.5 21.5 21h-3.1L16 15.6 13.6 21h-3.1L16 9.5Z" fill="currentColor" />
    </svg>
  );
}
