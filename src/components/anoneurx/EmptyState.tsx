import { Plus, DownloadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "./BrandMark";

export function EmptyState({
  onAdd,
  onImport,
}: {
  onAdd: () => void;
  onImport: () => void;
}) {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-4 py-14 text-center sm:py-20">
      <div className="relative grid h-24 w-24 place-items-center rounded-2xl border border-border bg-surface">
        <div className="absolute inset-0 rounded-2xl bg-primary/5" aria-hidden="true" />
        <BrandMark size={44} className="relative text-primary" />
      </div>
      <h2 className="mt-7 text-xl font-semibold sm:text-2xl">Your authenticator is ready.</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Add your first account to start generating secure verification codes offline.
      </p>
      <div className="mt-7 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Button onClick={onAdd} className="h-11 gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add account
        </Button>
        <Button onClick={onImport} variant="outline" className="h-11 gap-2">
          <DownloadCloud className="h-4 w-4" aria-hidden="true" />
          Import backup
        </Button>
      </div>
      <dl className="mt-8 grid w-full gap-2 text-xs text-muted-foreground">
        <div className="rounded-lg border border-border bg-surface px-3 py-2">
          No cloud account required.
        </div>
        <div className="rounded-lg border border-border bg-surface px-3 py-2">
          Your secrets stay on this device.
        </div>
      </dl>
    </section>
  );
}
