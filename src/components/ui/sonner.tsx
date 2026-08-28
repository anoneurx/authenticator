import { Toaster as Sonner } from "sonner";
import { useVault } from "@/store/vault";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { settings } = useVault();
  const theme = settings.theme === "light" ? "light" : "dark";

  return (
    <Sonner
      theme={theme}
      position="top-center"
      className="toaster group"
      toastOptions={{
        duration: 2500,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:gap-3 group-[.toaster]:w-[90vw] group-[.toaster]:max-w-md group-[.toaster]:my-2 animate-in slide-in-from-top-4 duration-300",
          title: "group-[.toast]:font-bold group-[.toast]:text-sm text-foreground tracking-tight",
          description: "group-[.toast]:text-xs group-[.toast]:text-muted-foreground mt-0.5",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-semibold rounded-lg text-xs px-3 py-1.5",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground rounded-lg text-xs px-3 py-1.5",
          success: "group-[.toast]:border-emerald-500/40 group-[.toast]:bg-emerald-500/10",
          error: "group-[.toast]:border-destructive/40 group-[.toast]:bg-destructive/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
