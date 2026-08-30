import { cn } from "@/lib/utils";
import logoImg from "@/assets/logo.png";

/** App logo mark. */
export function BrandMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <img
      src={logoImg}
      alt="Anoneurx Authenticator"
      className={cn("shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}

