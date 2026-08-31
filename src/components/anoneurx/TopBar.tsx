import { useState } from "react";
import { Plus, Search, Lock, Sun, Moon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVault } from "@/store/vault";
import { BrandMark } from "./BrandMark";

export function TopBar({
  onAddAccount,
}: {
  onAddAccount: () => void;
}) {
  const { searchQuery, setSearchQuery, lock, settings, updateSettings } = useVault();
  const [showSearch, setShowSearch] = useState(false);

  const isLight = settings.theme === "light";

  function toggleTheme() {
    updateSettings({ theme: isLight ? "dark" : "light" });
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-6 shadow-xs select-none">
      {/* Left: Brand logo + Authenticator Title */}
      <div className="flex items-center gap-2.5">
        <BrandMark className="h-7 w-7 text-primary shrink-0" />
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
          Authenticator
        </h1>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={lock}
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Lock vault"
            aria-label="Lock vault"
          >
            <Lock className="h-4 w-4" />
          </Button>
        </div>
    </header>
  );
}
