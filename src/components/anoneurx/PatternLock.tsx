import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PatternLockProps {
  onComplete: (nodes: number[]) => void;
  disabled?: boolean;
  status?: "idle" | "error" | "success";
  minLength?: number;
}

/**
 * A 3x3 unlock-pattern pad. Purely local — the drawn path is emitted
 * as node indices and never rendered as a readable value.
 */
export function PatternLock({
  onComplete,
  disabled = false,
  status = "idle",
  minLength = 4,
}: PatternLockProps) {
  const [nodes, setNodes] = useState<number[]>([]);
  const [drawing, setDrawing] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const addNode = useCallback(
    (index: number) => {
      setNodes((prev) => (prev.includes(index) ? prev : [...prev, index]));
    },
    [],
  );

  function start(index: number) {
    if (disabled) return;
    setDrawing(true);
    setNodes([index]);
  }

  function enter(index: number) {
    if (!drawing || disabled) return;
    addNode(index);
  }

  function finish() {
    if (!drawing) return;
    setDrawing(false);
    if (nodes.length >= minLength) {
      onComplete(nodes);
    }
    setTimeout(() => setNodes([]), 350);
  }

  return (
    <div
      ref={gridRef}
      onPointerUp={finish}
      onPointerLeave={finish}
      className="grid w-56 grid-cols-3 gap-5 touch-none select-none"
      role="application"
      aria-label="Unlock pattern pad"
    >
      {Array.from({ length: 9 }).map((_, i) => {
        const active = nodes.includes(i);
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onPointerDown={() => start(i)}
            onPointerEnter={() => enter(i)}
            onClick={() => {
              if (!drawing) {
                addNode(i);
              }
            }}
            aria-label={`Pattern node ${i + 1}`}
            className={cn(
              "grid h-12 w-12 place-items-center rounded-full border-2 border-border bg-muted/30 transition-all",
              active && "border-primary bg-primary/20 scale-110",
              status === "error" && active && "border-destructive bg-destructive/20",
              status === "success" && active && "border-emerald-500 bg-emerald-500/20",
              disabled && "opacity-50",
            )}
          >
            <span
              className={cn(
                "h-3 w-3 rounded-full bg-muted-foreground/40 transition-colors",
                active && "bg-primary",
                status === "error" && active && "bg-destructive",
                status === "success" && active && "bg-emerald-500",
              )}
            />
          </button>
        );
      })}
      <div className="col-span-3 flex justify-center gap-1.5 pt-1" aria-hidden>
        {Array.from({ length: Math.max(nodes.length, 0) }).map((_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary" />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setNodes([])}
        className="col-span-3 text-[11px] text-muted-foreground hover:text-foreground"
      >
        Reset pattern
      </button>
    </div>
  );
}
