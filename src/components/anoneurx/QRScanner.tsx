import { useEffect, useRef, useState } from "react";
import { CameraOff, ScanLine, Loader2, Upload, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { decodeQrFromVideoOrCanvas, decodeQrImageData } from "@/lib/qr-decoder";
import { Capacitor } from "@capacitor/core";

type ScanState = "starting" | "scanning" | "denied" | "unavailable";

async function requestCameraPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    const { Camera } = await import("@capacitor/camera");
    const status = await Camera.requestPermissions({ permissions: ["camera"] });
    return status.camera === "granted" || status.camera === "limited";
  } catch {
    return false;
  }
}

export function QRScanner({
  onDetected,
  onManual,
}: {
  onDetected: (uri: string) => void;
  onManual: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<ScanState>("starting");
  const hasScannedRef = useRef(false);

  // Request permission then start environment camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function startCamera() {
      const granted = await requestCameraPermission();
      if (!granted || cancelled) {
        if (!cancelled) setState("denied");
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setState("unavailable");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setState("scanning");
      } catch {
        setState("denied");
      }
    }

    void startCamera();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Continuous real-time frame scanner
  useEffect(() => {
    if (state !== "scanning") return;
    let animationId: number;
    let isProcessing = false;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    async function scanFrame() {
      if (!videoRef.current || hasScannedRef.current) return;

      const video = videoRef.current;
      if (video.readyState === video.HAVE_ENOUGH_DATA && !isProcessing && ctx) {
        isProcessing = true;
        try {
          const detected = await decodeQrFromVideoOrCanvas(video, canvas, ctx);
          if (detected && !hasScannedRef.current) {
            hasScannedRef.current = true;
            onDetected(detected);
          }
        } catch {
          // Frame scan error ignore
        } finally {
          isProcessing = false;
        }
      }

      if (!hasScannedRef.current) {
        animationId = requestAnimationFrame(scanFrame);
      }
    }

    animationId = requestAnimationFrame(scanFrame);
    return () => cancelAnimationFrame(animationId);
  }, [state, onDetected]);

  // Handle uploaded QR code image file
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await img.decode();

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        onDetected("");
        return;
      }
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = decodeQrImageData(imageData);
      onDetected(decoded ?? ""); // Empty string triggers invalid QR popup notification
    } catch {
      onDetected(""); // Triggers invalid QR popup notification
    }
  }

  return (
    <div className="space-y-4">
      {/* Live Camera Viewport */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-black">
        <video
          ref={videoRef}
          muted
          autoPlay
          playsInline
          aria-label="Camera preview for QR scanning"
          className="h-full w-full object-cover opacity-90"
        />

        {state !== "scanning" && (
          <div className="absolute inset-0 grid place-items-center bg-background/85 px-6 text-center">
            {state === "starting" ? (
              <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
                <span>Initializing camera...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <CameraOff className="h-7 w-7 text-amber-500" aria-hidden="true" />
                <p className="text-sm font-semibold">
                  {state === "denied" ? "Camera access denied" : "No camera available"}
                </p>
                <p className="max-w-xs text-xs text-muted-foreground leading-relaxed">
                  {state === "denied"
                    ? "Please grant camera permission in your device settings or choose an alternative entry method."
                    : "No compatible video input device found on this system."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-[5px] text-xs mt-1"
                  onClick={onManual}
                >
                  Enter Key Manually
                </Button>
              </div>
            )}
          </div>
        )}

        {state === "scanning" && (
          <>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="relative h-56 w-56">
                {(
                  [
                    "left-0 top-0 border-l-2 border-t-2 rounded-tl-lg",
                    "right-0 top-0 border-r-2 border-t-2 rounded-tr-lg",
                    "left-0 bottom-0 border-l-2 border-b-2 rounded-bl-lg",
                    "right-0 bottom-0 border-r-2 border-b-2 rounded-br-lg",
                  ] as const
                ).map((pos) => (
                  <span key={pos} className={`absolute h-8 w-8 border-primary ${pos}`} />
                ))}
                <ScanLine
                  className="absolute inset-x-0 top-1/2 mx-auto h-6 w-44 -translate-y-1/2 text-primary/80 animate-pulse"
                  aria-hidden="true"
                />
              </div>
            </div>
            <p className="absolute inset-x-0 bottom-3 text-center text-xs font-medium text-white/90 drop-shadow-sm">
              Position 2FA QR code inside the target frame
            </p>
          </>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Upload Image & Manual Key Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-9 rounded-[5px] text-xs flex items-center justify-center gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload Image
        </Button>

        <Button
          variant="secondary"
          size="sm"
          className="flex-1 h-9 rounded-[5px] text-xs flex items-center justify-center gap-2"
          onClick={onManual}
        >
          <KeyRound className="h-3.5 w-3.5" />
          Manual Key
        </Button>
      </div>
    </div>
  );
}
