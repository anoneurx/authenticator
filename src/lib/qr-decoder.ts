/**
 * QR Code Decoder Engine.
 *
 * 1. Native BarcodeDetector API when available (Chrome/Android).
 * 2. jsQR fallback - a real QR decoder (finder patterns + Reed-Solomon ECC)
 *    that works in every browser, fully offline.
 */
import jsQR from "jsqr";

/** Max width/height fed to jsQR from live video; keeps per-frame cost low. */
const MAX_DECODE_SIZE = 640;

export function decodeQrImageData(imageData: ImageData): string | null {
  if (imageData.width < 20 || imageData.height < 20) return null;
  try {
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });
    return result?.data ?? null;
  } catch {
    return null;
  }
}

interface DetectedBarcode {
  rawValue: string;
}
type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]>;
};
type BarcodeDetectorCtor = new (options: { formats: string[] }) => BarcodeDetectorLike;

async function detectWithBarcodeDetector(video: HTMLVideoElement): Promise<string | null> {
  if (!("BarcodeDetector" in window)) return null;
  try {
    const Ctor = (window as unknown as { BarcodeDetector: BarcodeDetectorCtor }).BarcodeDetector;
    const detector = new Ctor({ formats: ["qr_code"] });
    const barcodes = await detector.detect(video);
    const first = barcodes[0];
    if (first?.rawValue) {
      return first.rawValue;
    }
  } catch {
    // Fall through to jsQR below
  }
  return null;
}

function drawScaledFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): ImageData | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;

  const scale = Math.min(1, MAX_DECODE_SIZE / Math.max(vw, vh));
  canvas.width = Math.round(vw * scale);
  canvas.height = Math.round(vh * scale);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  try {
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    return null;
  }
}

export async function decodeQrFromVideoOrCanvas(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): Promise<string | null> {
  // 1. Native detector first (fast path)
  const native = await detectWithBarcodeDetector(video);
  if (native) return native;

  // 2. Real software decoding via jsQR on the current frame
  if (video.readyState < video.HAVE_CURRENT_DATA) return null;
  const imageData = drawScaledFrame(video, canvas, ctx);
  if (!imageData) return null;
  return decodeQrImageData(imageData);
}
