import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  WifiOff,
  LockKeyhole,
  Smartphone,
  Database,
  Github,
  X,
} from "lucide-react";
import { useEffect } from "react";
import { useVault } from "@/store/vault";
import heroImage from "@/assets/hero.jpeg";

const APP_VERSION = "1.0.0";
const BUILD_DATE = "Aug 2026";

interface AboutScreenProps {
  onClose: () => void;
}


export function AboutScreen({ onClose }: AboutScreenProps) {
  const { accounts } = useVault();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      data-custom-overlay="open"
      className="fixed inset-0 z-50 flex flex-col bg-background text-foreground animate-in slide-in-from-right-full duration-300 overflow-hidden"
    >

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-5 py-12 relative z-10">
        <div className="mx-auto w-full max-w-lg space-y-8">
          {/* Hero Section matching the image */}
          <section className="flex flex-col items-center text-center pt-4">
            <img
              src={heroImage}
              alt="ANONEURX"
              className="h-auto w-auto"
            />
          </section>

          {/* Description */}
          <section className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              About Anoneurx Authenticator
            </h3>

            <p className="text-sm leading-6 text-muted-foreground">
              Anoneurx Authenticator is a privacy-first, offline two-factor
              authentication app designed to generate TOTP security codes
              directly on your device.
            </p>

            <p className="text-sm leading-6 text-muted-foreground pt-1 border-t border-border/40">
              No cloud synchronization. No account required. No server
              communication. Your authentication secrets remain completely under your control.
            </p>
          </section>

          {/* Feature Cards Grid */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Built for privacy
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <FeatureCard
                icon={WifiOff}
                title="Offline"
                description="Works 100% without an internet connection."
              />

              <FeatureCard
                icon={LockKeyhole}
                title="Encrypted"
                description="Secrets protected with AES-256-GCM."
              />

              <FeatureCard
                icon={Smartphone}
                title="On-device"
                description="All code generation happens locally."
              />

              <FeatureCard
                icon={Database}
                title="Zero Cloud"
                description="Your vault never leaves your device."
              />
            </div>
          </section>

          {/* Security Architecture */}
          <section className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md p-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <LockKeyhole className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">
                  Security architecture
                </h3>

                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  Your secrets are encrypted using AES-256-GCM. Master keys are
                  derived via PBKDF2-SHA256 with 100,000 iterations. Cryptographic
                  operations run offline via WebCrypto API.
                </p>
              </div>
            </div>
          </section>

          {/* Learn More Card */}
          <a
            href="https://opensource.anoneurx.com/authenticator"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md p-4 transition-all hover:bg-muted/50 active:scale-[0.99] shadow-xs"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface">
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">
                  Anoneurx Open Source
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Visit open-source project repository
                </p>
              </div>
            </div>

            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>

          {/* Vault Stats */}
          <section className="overflow-hidden rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md">
            <div className="grid grid-cols-2 divide-x divide-border/60">
              <Stat label="Active Accounts" value={accounts.length.toString()} />
              <Stat label="App Version" value={`v${APP_VERSION}`} />
            </div>

            <div className="border-t border-border/60 px-4 py-3 text-center bg-muted/20">
              <p className="text-[11px] text-muted-foreground">
                Build Release {BUILD_DATE}
              </p>
            </div>
          </section>

          {/* Footer */}
          <footer className="pt-4 flex flex-col items-center text-center pb-8">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-[0.25em] text-foreground uppercase">
                ANONEURX
              </span>
            </div>

            <p className="mt-2 max-w-xs text-[11px] leading-5 text-muted-foreground">
              Private authentication. Local by design.
              <br />
              Your secrets belong to you.
            </p>

            <a
              href="https://github.com/anoneurx"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-3.5 w-3.5" />
              Open Source
            </a>
          </footer>
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-foreground">
        <Icon className="h-4 w-4" />
      </div>

      <h4 className="mt-3 text-sm font-semibold text-foreground">
        {title}
      </h4>

      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-4">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}