import { type CSSProperties, type ReactNode } from "react";
import { getServiceIcon } from "./serviceIcons";

type ServiceIconSize = "sm" | "md" | "lg";

const sizeMap: Record<ServiceIconSize, string> = {
  sm: "h-7 w-7 rounded-md",
  md: "h-10 w-10 rounded-lg",
  lg: "h-14 w-14 rounded-xl",
};

const svgSizeMap: Record<ServiceIconSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

const palette = [
  "#0078D4",
  "#E5484D",
  "#F76808",
  "#30A46C",
  "#8E4EC6",
  "#0091FF",
  "#D6409F",
  "#FFB224",
  "#12A594",
  "#6E56CF",
];

function isDarkOrWhiteHex(hex: string): boolean {
  const clean = hex.toLowerCase().replace("#", "");
  return (
    clean === "000000" ||
    clean === "181717" ||
    clean === "111111" ||
    clean === "000" ||
    clean === "ffffff" ||
    clean === "fff"
  );
}

const amazonSvg = (sz: string) => (
  <svg viewBox="0 0 24 24" className={sz} role="img" aria-label="Amazon">
    <path
      fill="#FF9900"
      d="M18.75 16.5c-3.1 2.2-7.5 3.3-11.4 3.3-5.4 0-10.2-1.9-13.9-5.1-.3-.3 0-.7.4-.4 4.1 2.4 9.2 3.9 14.4 3.9 3.6 0 7.4-.9 10.8-2.6.5-.3 1 .4.7.9z"
    />
    <path
      fill="#FF9900"
      d="M20.8 14.7c-.4-.5-2.5-.2-3.5-.1-.3 0-.3-.2-.1-.4 1.2-.9 3.2-.6 3.9.3.7.9.2 3-1 3.9-.2.2-.4.1-.3-.2.3-.9 1.3-3 1-3.5z"
    />
    <path
      fill="#FFFFFF"
      d="M7 6.5l-2.5 9h2.1l.6-2.3h2.6l.6 2.3h2.1l-2.5-9H7zm.7 2.1l.9 3.3H6.8l.9-3.3zm8.3 3.6c0-.5.2-.9.7-1.1.5-.2 1.2-.3 2.1-.3.7 0 1.2.1 1.6.2v-.4c0-.4-.1-.7-.4-.9-.3-.2-.7-.3-1.3-.3-.5 0-1 .1-1.5.3l-.3-1.3c.7-.3 1.4-.4 2.2-.4 1.1 0 2 .3 2.5.8.5.5.8 1.3.8 2.3v4.6h-1.8v-.9c-.4.4-1.1.8-2 .8-.8 0-1.5-.2-1.9-.7-.5-.4-.7-1-.7-1.7zm3.8 0v-1.1c-.3-.1-.7-.2-1.1-.2-.5 0-.9.1-1.1.2-.2.1-.3.3-.3.6 0 .3.1.5.3.6.2.1.6.2 1.1.2.4 0 .8-.1 1.1-.3z"
    />
  </svg>
);

const awsSvg = (sz: string) => (
  <svg viewBox="0 0 24 24" className={sz} role="img" aria-label="AWS">
    <path
      fill="#FF9900"
      d="M18.75 16.5c-3.1 2.2-7.5 3.3-11.4 3.3-5.4 0-10.2-1.9-13.9-5.1-.3-.3 0-.7.4-.4 4.1 2.4 9.2 3.9 14.4 3.9 3.6 0 7.4-.9 10.8-2.6.5-.3 1 .4.7.9z"
    />
    <path
      fill="#FF9900"
      d="M20.8 14.7c-.4-.5-2.5-.2-3.5-.1-.3 0-.3-.2-.1-.4 1.2-.9 3.2-.6 3.9.3.7.9.2 3-1 3.9-.2.2-.4.1-.3-.2.3-.9 1.3-3 1-3.5z"
    />
    <path
      fill="#FFFFFF"
      d="M7 6.5l-2.5 9h2.1l.6-2.3h2.6l.6 2.3h2.1l-2.5-9H7zm.7 2.1l.9 3.3H6.8l.9-3.3zm8.3 3.6c0-.5.2-.9.7-1.1.5-.2 1.2-.3 2.1-.3.7 0 1.2.1 1.6.2v-.4c0-.4-.1-.7-.4-.9-.3-.2-.7-.3-1.3-.3-.5 0-1 .1-1.5.3l-.3-1.3c.7-.3 1.4-.4 2.2-.4 1.1 0 2 .3 2.5.8.5.5.8 1.3.8 2.3v4.6h-1.8v-.9c-.4.4-1.1.8-2 .8-.8 0-1.5-.2-1.9-.7-.5-.4-.7-1-.7-1.7zm3.8 0v-1.1c-.3-.1-.7-.2-1.1-.2-.5 0-.9.1-1.1.2-.2.1-.3.3-.3.6 0 .3.1.5.3.6.2.1.6.2 1.1.2.4 0 .8-.1 1.1-.3z"
    />
  </svg>
);

const adobeSvg = (sz: string) => (
  <svg viewBox="0 0 24 24" className={sz} role="img" aria-label="Adobe">
    <path
      fill="#FF0000"
      d="M13.966 0H24v24zM0 0h10.034L0 24zM9.53 14.28l3.19-7.85H17.4L24 24h-4.32l-2.31-6h-6.72l-1.35 6H5.25zm5.7-4.41L13.1 14.8h3.98z"
    />
  </svg>
);

const openAiSvg = (sz: string) => (
  <svg viewBox="0 0 24 24" className={sz} role="img" aria-label="OpenAI">
    <path
      fill="#10A37F"
      d="M22.28 9.82a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9 6.07 6.07 0 0 0-10.27 2.17 5.98 5.98 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.51 2.9A5.98 5.98 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.21 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.07zm-9.02 12.61a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.79-2.77a.8.8 0 0 0 .4-.69v-6.76l2.03 1.17a.08.08 0 0 1 .04.06v5.58a4.5 4.5 0 0 1-4.5 4.53z"
    />
  </svg>
);

const canvaSvg = (sz: string) => (
  <svg viewBox="0 0 24 24" className={sz} role="img" aria-label="Canva">
    <circle cx="12" cy="12" r="11" fill="#00C4CC" />
    <path
      fill="#FFFFFF"
      d="M10.2 17.5c-2.8 0-4.2-2.1-4.2-4.5 0-3.3 2.5-6.5 6.3-6.5 2.1 0 3.7 1.1 3.7 2.9 0 2.4-2.1 4.1-4.3 4.1-.7 0-1.4-.2-1.9-.6l-.6 2.5c.3.1.8.2 1.2.2 3.1 0 5.9-2.2 5.9-5.7 0-2.8-2.2-4.4-5.2-4.4-4.8 0-8.2 3.9-8.2 8 0 3.4 2.1 5.7 5.7 5.7 1.5 0 2.9-.5 3.9-1.2l-.7-1.3c-.8.5-1.8.8-2.7.8z"
    />
  </svg>
);

const multiColorIcons: Record<string, (sz: string) => ReactNode> = {
  amazon: amazonSvg,
  amazone: amazonSvg,
  aws: awsSvg,
  amazonaws: awsSvg,
  amazonwebservices: awsSvg,
  adobe: adobeSvg,
  adabie: adobeSvg,
  adobi: adobeSvg,
  openai: openAiSvg,
  "open-ai": openAiSvg,
  canva: canvaSvg,
  google: (sz) => (
    <svg viewBox="0 0 24 24" className={sz} role="img" aria-label="Google">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24a7.17 7.17 0 0 1 0-4.48V6.61H1.29a11.96 11.96 0 0 0 0 10.78l3.99-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
      />
    </svg>
  ),
  microsoft: (sz) => (
    <svg viewBox="0 0 24 24" className={sz} role="img" aria-label="Microsoft">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
  ),
  outlook: (sz) => (
    <svg viewBox="0 0 24 24" className={sz} role="img" aria-label="Microsoft Outlook">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
  ),
  figma: (sz) => (
    <svg viewBox="0 0 24 24" className={sz} role="img" aria-label="Figma">
      <path d="M8 12a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" fill="#1ABCFE" />
      <path d="M4 8a4 4 0 0 1 4-4h4v8H8a4 4 0 0 1-4-4z" fill="#F24E1E" />
      <path d="M12 4h4a4 4 0 0 1 0 8h-4V4z" fill="#FF7262" />
      <path d="M4 16a4 4 0 0 1 4-4h4v8a4 4 0 0 1-8 0z" fill="#0ACF83" />
      <path d="M4 12a4 4 0 0 1 4-4h4v8H8a4 4 0 0 1-4-4z" fill="#A259FF" />
    </svg>
  ),
  slack: (sz) => (
    <svg viewBox="0 0 24 24" className={sz} role="img" aria-label="Slack">
      <path
        fill="#E01E5A"
        d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.528 2.528 0 0 1 2.521-2.52 2.528 2.528 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"
      />
      <path
        fill="#2EB67D"
        d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"
      />
      <path
        fill="#ECB22E"
        d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"
      />
      <path
        fill="#36C5F0"
        d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.528 2.528 0 0 1 2.52-2.52h6.323A2.528 2.528 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
      />
    </svg>
  ),
  gitlab: (sz) => (
    <svg viewBox="0 0 24 24" className={sz} role="img" aria-label="GitLab">
      <path
        fill="#E24329"
        d="M23.6 9.89l-2.62-8.06a.8.8 0 0 0-1.52 0l-2.62 8.06H7.16L4.54 1.83a.8.8 0 0 0-1.52 0L.4 9.89a1.6 1.6 0 0 0 .58 1.8l11.02 8.01 11.02-8.01a1.6 1.6 0 0 0 .58-1.8z"
      />
      <path fill="#FC6D26" d="M12 19.7l4.84-14.91H7.16L12 19.7z" />
      <path fill="#FCA326" d="M12 19.7L.4 9.89a1.6 1.6 0 0 0 .58 1.8l11.02 8.01z" />
    </svg>
  ),
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initials(issuer: string): string {
  const trimmed = issuer.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/[\s.\-_]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function ServiceIcon({
  issuer,
  size = "md",
}: {
  issuer: string;
  size?: ServiceIconSize;
}) {
  const normalizedKey = issuer.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

  // Check for authentic multi-color SVG icons first
  if (multiColorIcons[normalizedKey]) {
    const isDarkBg =
      normalizedKey.includes("amazon") || normalizedKey.includes("aws");
    const color = isDarkBg
      ? "#232F3E"
      : normalizedKey.includes("adabie") || normalizedKey.includes("adobe")
        ? "#FF0000"
        : normalizedKey.includes("openai")
          ? "#10A37F"
          : normalizedKey === "canva"
            ? "#00C4CC"
            : normalizedKey === "google"
              ? "#4285F4"
              : normalizedKey === "microsoft" || normalizedKey === "outlook"
                ? "#00A4EF"
                : normalizedKey === "figma"
                  ? "#F24E1E"
                  : "#4A154B";
    const style: CSSProperties = isDarkBg
      ? {
          backgroundColor: "#1A222C",
        }
      : {
          backgroundColor: `${color}1F`,
        };
    return (
      <div
        className={`flex shrink-0 items-center justify-center ${sizeMap[size]}`}
        style={style}
        title={issuer}
        aria-label={issuer}
      >
        {multiColorIcons[normalizedKey](svgSizeMap[size])}
      </div>
    );
  }

  const icon = getServiceIcon(issuer);

  if (icon) {
    const isMonochromeDarkOrLight = isDarkOrWhiteHex(icon.hex);

    if (isMonochromeDarkOrLight) {
      return (
        <div
          className={`flex shrink-0 items-center justify-center bg-muted/60 text-foreground transition-colors ${sizeMap[size]}`}
          title={icon.title}
          aria-label={icon.title}
        >
          <svg
            role="img"
            viewBox="0 0 24 24"
            className={svgSizeMap[size]}
            fill="currentColor"
            aria-hidden="true"
          >
            <path d={icon.path} />
          </svg>
        </div>
      );
    }

    const color = `#${icon.hex}`;
    const style: CSSProperties = {
      backgroundColor: `${color}1F`,
      color,
    };
    return (
      <div
        className={`flex shrink-0 items-center justify-center ${sizeMap[size]}`}
        style={style}
        title={icon.title}
        aria-label={icon.title}
      >
        <svg
          role="img"
          viewBox="0 0 24 24"
          className={svgSizeMap[size]}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d={icon.path} />
        </svg>
      </div>
    );
  }

  const color = palette[hashString(issuer) % palette.length];
  const style: CSSProperties = {
    backgroundColor: `${color}1F`,
    color,
  };

  return (
    <div
      className={`flex shrink-0 items-center justify-center font-bold uppercase tracking-tight ${sizeMap[size]}`}
      style={style}
      aria-hidden="true"
    >
      {initials(issuer)}
    </div>
  );
}
