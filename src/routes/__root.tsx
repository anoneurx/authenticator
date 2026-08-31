import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { App } from "@capacitor/app";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { VaultProvider, useVault } from "@/store/vault";
import { Toaster } from "@/components/ui/sonner";
import { SplashScreen } from "@/components/anoneurx/SplashScreen";

function BackButtonHandler() {
  const router = useRouter();
  const { locked } = useVault();

  useEffect(() => {
    const listener = App.addListener("backButton", ({ canGoBack }) => {
      // Close any open dialogs/overlays first
      const overlay = document.querySelector(
        '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [data-custom-overlay="open"]'
      );
      if (overlay) {
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Escape",
            code: "Escape",
            keyCode: 27,
            which: 27,
            bubbles: true,
            cancelable: true,
          })
        );
        return;
      }

      // If vault is locked, don't navigate - just stay on lock screen
      if (locked) {
        return;
      }

      // Use router history to navigate to previous screen
      try {
        const history = router.history;
        const current = history.location;
        // Check if we're at the root route
        if (current.pathname === "/") {
          App.exitApp();
          return;
        }
        // Navigate back using router
        history.back();
      } catch {
        // Fallback to window history
        if (window.history.length > 1) {
          window.history.back();
        } else {
          App.exitApp();
        }
      }
    });

    return () => {
      listener.then((handle) => handle.remove()).catch(() => {});
    };
  }, [router, locked]);

  return null;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-6xl font-bold tracking-tight text-foreground">404</h1>
        <h2 className="text-xl font-semibold text-foreground">Page not found</h2>
        <p className="text-sm text-muted-foreground">
          The security screen or path you're looking for doesn't exist.
        </p>
        <div>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to Authenticator
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Application Error
        </h1>
        <p className="text-sm text-muted-foreground">
          An unexpected local error occurred. You can retry loading or return to the main vault.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "Authenticator — Offline TOTP & Security Vault" },
      {
        name: "description",
        content:
          "Your codes. Your device. Your privacy. 100% offline, zero-knowledge TOTP authenticator.",
      },
      { name: "theme-color", content: "#18181b" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { property: "og:title", content: "Authenticator" },
      {
        property: "og:description",
        content: "Your codes. Your device. Your privacy. Completely offline authenticator.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [splashDone, setSplashDone] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <VaultProvider>
        {/* Splash screen shown once on launch */}
        {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
        {/* Android hardware back button handler */}
        <BackButtonHandler />
        {/* Required: nested routes render here */}
        <Outlet />
        <Toaster />
      </VaultProvider>
    </QueryClientProvider>
  );
}
