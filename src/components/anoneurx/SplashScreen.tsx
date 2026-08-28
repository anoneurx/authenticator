import { useEffect, useState } from "react";
import bgImage from "@/assets/background.jpg";

/**
 * Full-screen animated splash/logo screen shown once on app launch.
 * Background: /assets/background.jpg with a dark overlay.
 * Fades in the logo, holds for ~2s, then fades out and calls onDone.
 */
export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase("hold"), 350);
    const t2 = window.setTimeout(() => setPhase("out"), 2100);
    const t3 = window.setTimeout(() => onDone(), 2750);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center pointer-events-none overflow-hidden"
      style={{
        transition: "opacity 650ms ease-in-out",
        opacity: phase === "out" ? 0 : 1,
      }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Central Logo Block */}
      <div
        className="relative z-10 flex flex-col items-center gap-6"
        style={{
          transition: "opacity 650ms ease-out, transform 650ms ease-out",
          opacity: phase === "in" ? 0 : 1,
          transform: phase === "in" ? "scale(0.84) translateY(18px)" : "scale(1) translateY(0)",
        }}
      >
        {/* Shield Icon */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/30 blur-3xl scale-[2]" />
          <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              className="h-16 w-16 text-white drop-shadow"
              aria-label="Anoneurx Authenticator Logo"
            >
              <path
                d="M24 4L6 12V24C6 34.2 13.8 43.7 24 46C34.2 43.7 42 34.2 42 24V12L24 4Z"
                fill="white"
                fillOpacity="0.12"
                stroke="white"
                strokeOpacity="0.5"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <rect x="17" y="23" width="14" height="10" rx="2" fill="white" />
              <path
                d="M20 23V19C20 16.8 21.8 15 24 15C26.2 15 28 16.8 28 19V23"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="24" cy="27.5" r="1.5" fill="rgba(0,0,0,0.5)" />
            </svg>
          </div>
        </div>

        {/* Wordmark */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span
            className="text-sm font-bold tracking-tight"
            style={{ fontFamily: "'Anurati', var(--font-display)" }}
          >
            ANONEURX AUTHENTICATOR
          </span>

        </div>
      </div>

      {/* Tagline */}
      <p
        className="absolute bottom-10 text-[10px] tracking-[0.2em] font-medium text-white/40 uppercase select-none"
        style={{
          transition: "opacity 700ms ease-out",
          opacity: phase === "in" ? 0 : 0.7,
        }}
      >
        POWERED BY ANONEURX
      </p>
    </div>
  );
}
