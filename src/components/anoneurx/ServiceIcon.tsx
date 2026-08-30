import { type CSSProperties, type ReactNode } from "react";
import { getServiceIcon } from "./serviceIcons";
import * as simpleIcons from "simple-icons";
import metamaskImg from "../../assets/appsicons/metamask.png";
import xboxImg from "../../assets/appsicons/xbox.png";
import figmaImg from "../../assets/appsicons/figma.png";
import protonmailImg from "../../assets/appsicons/protonmail.png";
import amazonImg from "../../assets/appsicons/amazone.jpeg";
import awsImg from "../../assets/appsicons/aws.png";
import ebayImg from "../../assets/appsicons/ebay.png";
import gitlabImg from "../../assets/appsicons/gitlab.png";
import adobeImg from "../../assets/appsicons/adobie.png";

type ServiceIconSize = "sm" | "md" | "lg";

const sizeMap: Record<ServiceIconSize, string> = {
  sm: "h-7 w-7 rounded-md",
  md: "h-10 w-10 rounded-lg",
  lg: "h-14 w-14 rounded-xl",
};

const svgSizeMap: Record<ServiceIconSize, string> = {
  sm: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-10 w-10",
};

/* Fallback colors for services with no logo at all (generic initials avatar) */
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


type SimpleIcon = { path: string; hex: string; title: string; slug: string };

const simpleIconBySlug = new Map<string, SimpleIcon>();
for (const value of Object.values(simpleIcons as Record<string, unknown>)) {
  if (
    value &&
    typeof value === "object" &&
    typeof (value as SimpleIcon).slug === "string" &&
    typeof (value as SimpleIcon).path === "string" &&
    typeof (value as SimpleIcon).hex === "string"
  ) {
    simpleIconBySlug.set((value as SimpleIcon).slug, value as SimpleIcon);
  }
}

function getSimpleIcon(slug: string): SimpleIcon | undefined {
  return simpleIconBySlug.get(slug);
}

function renderFlatIcon(path: string, hex: string, title: string, sz: string) {
  return (
    <svg viewBox="0 0 24 24" className={sz} role="img" aria-label={title} fill={hex.startsWith("#") ? hex : `#${hex}`}>
      <path d={path} />
    </svg>
  );
}

const archivedIcon = (path: string, hex: string, title: string) => (sz: string) =>
  renderFlatIcon(path, hex, title, sz);

const amazonSvg = (sz: string) => (
  <svg
    viewBox="0 0 24 24"
    className={`${sz} text-black dark:text-white`}
    role="img"
    aria-label="Amazon"
  >
    {/* 'a' emblem in currentColor (Black in light mode, White in dark mode) */}
    <path
      fill="currentColor"
      d="M6.61 11.8c0-1.005.247-1.863.743-2.577.495-.71 1.17-1.25 2.04-1.615.796-.335 1.756-.575 2.912-.72.39-.046 1.033-.103 1.92-.174v-.37c0-.93-.105-1.558-.3-1.875-.302-.43-.78-.65-1.44-.65h-.182c-.48.046-.896.196-1.246.46-.35.27-.575.63-.675 1.096-.06.3-.206.465-.435.51l-2.52-.315c-.248-.06-.372-.18-.372-.39 0-.046.007-.09.022-.15.247-1.29.855-2.25 1.82-2.88.976-.616 2.1-.975 3.39-1.05h.54c1.65 0 2.957.434 3.888 1.29.135.15.27.3.405.48.12.165.224.314.283.45.075.134.15.33.195.57.06.254.105.42.135.51.03.104.062.3.076.615.01.313.02.493.02.553v5.28c0 .376.06.72.165 1.036.105.313.21.54.315.674l.51.674c.09.136.136.256.136.36 0 .12-.06.226-.18.314-1.2 1.05-1.86 1.62-1.963 1.71-.165.135-.375.15-.63.045a6.062 6.062 0 01-.526-.496l-.31-.347a9.391 9.391 0 01-.317-.42l-.3-.435c-.81.886-1.603 1.44-2.4 1.665-.494.15-1.093.227-1.83.227-1.11 0-2.04-.343-2.76-1.034-.72-.69-1.08-1.665-1.08-2.94l-.05-.076zm3.753-.438c0 .566.14 1.02.425 1.364.285.34.675.512 1.155.512.045 0 .106-.007.195-.02.09-.016.134-.023.166-.023.614-.16 1.08-.553 1.424-1.178.165-.28.285-.58.36-.91.09-.32.12-.59.135-.8.015-.195.015-.54.015-1.005v-.54c-.84 0-1.484.06-1.92.18-1.275.36-1.92 1.17-1.92 2.43l-.035-.02zm9.162 7.027c.03-.06.075-.11.132-.17.362-.243.714-.41 1.05-.5a8.094 8.094 0 011.612-.24c.14-.012.28 0 .41.03.65.06 1.05.168 1.172.33.063.09.099.228.099.39v.15c0 .51-.149 1.11-.424 1.8-.278.69-.664 1.248-1.156 1.68-.073.06-.14.09-.197.09-.03 0-.06 0-.09-.012-.09-.044-.107-.12-.064-.24.54-1.26.806-2.143.806-2.64 0-.15-.03-.27-.087-.344-.145-.166-.55-.257-1.224-.257-.243 0-.533.016-.87.046-.363.045-.7.09-1 .135-.09 0-.148-.014-.18-.044-.03-.03-.036-.047-.02-.077 0-.017.006-.03.02-.063v-.06z"
    />
    {/* Signature Orange Smile Arrow (#FF9900) */}
    <path
      fill="#FF9900"
      d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726a17.617 17.617 0 01-10.951-.577 17.88 17.88 0 01-5.43-3.35c-.1-.074-.151-.15-.151-.22 0-.047.021-.09.051-.13z"
    />
  </svg>
);

const awsSvg = (sz: string) => (
  <svg
    viewBox="0 0 64 48"
    className={`${sz} text-[#232F3E] dark:text-white`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="AWS"
  >
    {/* AWS lettering */}
    <g fill="currentColor">
      {/* A */}
      <path d="M4.8 27.2c0-2.4 1.1-4.1 3.3-5.1 1.6-.7 3.8-1 6.7-1v-.8c0-1.5-.3-2.5-1-3-.7-.6-1.5-.8-2.6-.8-.9 0-1.7.1-2.5.4-.8.3-1.5.7-2.1 1.2l-1.5-2.4c.9-.8 2-1.4 3.2-1.8 1.2-.4 2.5-.6 4-.6 2.4 0 4.2.6 5.4 1.8 1.2 1.2 1.8 3 1.8 5.5v10.3h-4.2v-2.1c-.7 1-1.5 1.7-2.5 2.1-1 .5-2.1.7-3.3.7-2 0-3.6-.5-4.8-1.5-1.2-1-1.9-2.4-1.9-4.2zm8.2 2.4c1 0 1.9-.3 2.6-.9.7-.6 1.1-1.4 1.1-2.5v-2c-1.4.1-2.6.3-3.6.5-1.2.3-2.1.7-2.6 1.3-.5.5-.7 1.2-.7 1.9 0 .6.3 1 .8 1.3.6.3 1.4.4 2.4.4z" />

      {/* W */}
      <path d="M21.7 15.8h4.6l3.2 13.1 3.3-13.1h4.4l3.3 13.1 3.2-13.1h4.6l-5.3 16.8h-4.5l-3.5-12.4-3.4 12.4h-4.5l-5.4-16.8z" />

      {/* S */}
      <path d="M51.7 27.8c1.1.9 2.5 1.4 4.1 1.4 1.1 0 2-.2 2.6-.5.6-.4.9-.8.9-1.4 0-.5-.2-.9-.6-1.2-.4-.3-1.2-.6-2.3-.9l-2.4-.6c-1.8-.5-3.1-1.1-3.9-2-.8-.9-1.2-2-1.2-3.4 0-1.8.7-3.2 2-4.2 1.3-1 3.1-1.5 5.3-1.5 1.3 0 2.5.2 3.6.5 1.1.3 2 .8 2.8 1.5l-2 2.8c-.6-.5-1.3-.8-2.1-1.1-.8-.2-1.6-.4-2.4-.4-1 0-1.7.2-2.2.5-.5.3-.8.7-.8 1.2 0 .5.2.8.6 1.1.4.3 1.1.5 2.2.8l2.4.6c1.9.5 3.2 1.2 4 2.1.8.9 1.2 2.1 1.2 3.5 0 1.9-.7 3.4-2.2 4.5-1.5 1.1-3.5 1.6-6 1.6-1.5 0-2.9-.2-4.2-.7-1.3-.5-2.4-1.1-3.2-1.9l2.2-2.8z" />
    </g>

  {/* AWS Smile / Arrow — moved slightly down */}
<path
  fill="#FF9900"
  d="M7.1 38.0c11.2 6.3 25.4 8.1 38.7 4.6 2.4-.6 4.8-1.5 7-2.5.8-.4 1.5.7.7 1.2-11.4 7-26.1 9.3-39.5 5.1-3.7-1.1-7.2-2.7-10.4-4.6-.8-.5-.1-1.9.8-1.4.9.5 1.8 1 2.7 1.4z"
/>

{/* Arrow head — moved slightly down */}
<path
  fill="#FF9900"
  d="M51.8 37.6c-1.3-1.5-5.7-1.2-7.9-.9-.7.1-.8-.5-.2-.9 3.9-2.8 10.1-2 10.8-1.4.7.6-.2 6.8-3.4 9.6-.5.4-1 .2-.8-.4.6-1.9 2.7-5.2 1.5-6z"
/>
  </svg>
);

const ebaySvg = (sz: string) => (
  <img src={ebayImg} alt="eBay" className={`${sz} object-contain`} />
);

const gitlabSvg = (sz: string) => (
  <img src={gitlabImg} alt="GitLab" className={`${sz} object-contain`} />
);

const openAiSvg = archivedIcon(
  "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z",
  "#000000",
  "OpenAI"
);

const canvaSvg = archivedIcon(
  "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zM6.962 7.68c.754 0 1.337.549 1.405 1.2.069.583-.171 1.097-.822 1.406-.343.171-.48.172-.549.069-.034-.069 0-.137.069-.206.617-.514.617-.926.548-1.508-.034-.378-.308-.618-.583-.618-1.2 0-2.914 2.674-2.674 4.629.103.754.549 1.646 1.509 1.646.308 0 .65-.103.96-.24.5-.264.799-.47 1.097-.8-.073-.885.704-2.046 1.851-2.046.515 0 .926.205.96.583.068.514-.377.582-.514.582s-.378-.034-.378-.17c-.034-.138.309-.07.275-.378-.035-.206-.24-.274-.446-.274-.72 0-1.131.994-1.029 1.611.035.275.172.549.447.549.205 0 .514-.31.617-.755.068-.308.343-.514.583-.514.102 0 .17.034.205.171v.138c-.034.137-.137.548-.102.651 0 .069.034.171.17.171.092 0 .436-.18.777-.459.117-.59.253-1.298.253-1.357.034-.24.137-.48.617-.48.103 0 .171.034.205.171v.138l-.136.617c.445-.583 1.097-.994 1.508-.994.172 0 .309.102.309.274 0 .103 0 .274-.069.446-.137.377-.309.96-.412 1.474 0 .137.035.274.207.274.171 0 .685-.206 1.096-.754l.007-.004c-.002-.068-.007-.134-.007-.202 0-.411.035-.754.104-.994.068-.274.411-.514.617-.514.103 0 .205.069.205.171 0 .035 0 .103-.034.137-.137.446-.24.857-.24 1.269 0 .24.034.582.102.788 0 .034.035.069.07.069.068 0 .548-.445.89-1.028-.308-.206-.48-.549-.48-.96 0-.72.446-1.097.858-1.097.343 0 .617.24.617.72 0 .308-.103.65-.274.96h.102a.77.77 0 0 0 .584-.24.293.293 0 0 1 .134-.117c.335-.425.83-.74 1.41-.74.48 0 .924.205.959.582.068.515-.378.618-.515.618l-.002-.002c-.138 0-.377-.035-.377-.172 0-.137.309-.068.274-.376-.034-.206-.24-.275-.446-.275-.686 0-1.13.891-1.028 1.611.034.275.171.583.445.583.206 0 .515-.308.652-.754.068-.274.343-.514.583-.514.103 0 .17.034.205.171 0 .069 0 .206-.137.652-.17.308-.171.48-.137.617.034.274.171.48.309.583.034.034.068.102.068.102 0 .069-.034.138-.137.138-.034 0-.068 0-.103-.035-.514-.205-.72-.548-.789-.891-.205.24-.445.377-.72.377-.445 0-.89-.411-.96-.926a1.609 1.609 0 0 1 .075-.649c-.203.13-.422.203-.623.203h-.17c-.447.652-.927 1.098-1.27 1.303a.896.896 0 0 1-.377.104c-.068 0-.171-.035-.205-.104-.095-.152-.156-.392-.193-.667-.481.527-1.145.805-1.453.805-.343 0-.548-.206-.582-.55v-.376c.102-.754.377-1.2.377-1.337a.074.074 0 0 0-.069-.07c-.24 0-1.028.824-1.166 1.373l-.103.445c-.068.309-.377.515-.582.515-.103 0-.172-.035-.206-.172v-.137l.046-.233c-.435.31-.87.508-1.075.508-.308 0-.48-.172-.514-.412-.206.274-.445.412-.754.412-.352 0-.696-.24-.862-.593-.244.275-.523.553-.852.764-.48.309-1.028.549-1.68.549-.582 0-1.097-.309-1.371-.583-.412-.377-.651-.96-.686-1.509-.205-1.68.823-3.84 2.4-4.8.378-.205.755-.343 1.132-.343zm9.77 3.291c-.104 0-.172.172-.172.343 0 .274.137.583.309.755a1.74 1.74 0 0 0 .102-.583c0-.343-.137-.515-.24-.515z",
  "#00C4CC",
  "Canva"
);

const twilioSvg = archivedIcon(
  "M12 0C5.381-.008.008 5.352 0 11.971V12c0 6.64 5.359 12 12 12 6.64 0 12-5.36 12-12 0-6.641-5.36-12-12-12zm0 20.801c-4.846.015-8.786-3.904-8.801-8.75V12c-.014-4.846 3.904-8.786 8.75-8.801H12c4.847-.014 8.786 3.904 8.801 8.75V12c.015 4.847-3.904 8.786-8.75 8.801H12zm5.44-11.76c0 1.359-1.12 2.479-2.481 2.479-1.366-.007-2.472-1.113-2.479-2.479 0-1.361 1.12-2.481 2.479-2.481 1.361 0 2.481 1.12 2.481 2.481zm0 5.919c0 1.36-1.12 2.48-2.481 2.48-1.367-.008-2.473-1.114-2.479-2.48 0-1.359 1.12-2.479 2.479-2.479 1.361-.001 2.481 1.12 2.481 2.479zm-5.919 0c0 1.36-1.12 2.48-2.479 2.48-1.368-.007-2.475-1.113-2.481-2.48 0-1.359 1.12-2.479 2.481-2.479 1.358-.001 2.479 1.12 2.479 2.479zm0-5.919c0 1.359-1.12 2.479-2.479 2.479-1.367-.007-2.475-1.112-2.481-2.479 0-1.361 1.12-2.481 2.481-2.481 1.358 0 2.479 1.12 2.479 2.481z",
  "#F22F46",
  "Twilio"
);

const herokuSvg = archivedIcon(
  "M20.61 0H3.39C2.189 0 1.23.96 1.23 2.16v19.681c0 1.198.959 2.159 2.16 2.159h17.22c1.2 0 2.159-.961 2.159-2.159V2.16C22.77.96 21.811 0 20.61 0zm.96 21.841c0 .539-.421.96-.96.96H3.39c-.54 0-.96-.421-.96-.96V2.16c0-.54.42-.961.96-.961h17.22c.539 0 .96.421.96.961v19.681zM6.63 20.399L9.33 18l-2.7-2.4v4.799zm9.72-9.719c-.479-.48-1.379-1.08-2.879-1.08-1.621 0-3.301.421-4.5.84V3.6h-2.4v10.38l1.68-.78s2.76-1.26 5.16-1.26c1.2 0 1.5.66 1.5 1.26v7.2h2.4v-7.2c.059-.179.059-1.501-.961-2.52zM13.17 7.5h2.4c1.08-1.26 1.62-2.521 1.8-3.9h-2.399c-.241 1.379-.841 2.64-1.801 3.9z",
  "#430098",
  "Heroku"
);

const adobeSvg = (sz: string) => (
  <img src={adobeImg} alt="Adobe" className={`${sz} object-contain`} />
);

const slackSvg = (sz: string) => (
  <svg viewBox="0 0 24 24" className={sz} role="img" aria-label="Slack">
    <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.528 2.528 0 0 1 2.521-2.52 2.528 2.528 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" />
    <path fill="#2EB67D" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" />
    <path fill="#ECB22E" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" />
    <path fill="#36C5F0" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
  </svg>
);

const microsoftSvg = (sz: string) => (
  <svg viewBox="0 0 24 24" className={sz} role="img" aria-label="Microsoft">
    <rect x="1" y="1" width="10" height="10" fill="#F25022" />
    <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
    <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
    <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
  </svg>
);

const googleSvg = (sz: string) => (
  <svg viewBox="0 0 24 24" className={sz} role="img" aria-label="Google">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
    />
    <path
      fill="#34A853"
      d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
    />
  </svg>
);

const xboxSvg = (sz: string) => (
  <img src={xboxImg} alt="Xbox" className={`${sz} object-contain`} />
);


const nintendoSvg = (sz: string) => (
  <svg viewBox="0 0 24 24" className={sz} role="img" aria-label="Nintendo (approximation)">
    <circle cx="12" cy="12" r="12" fill="#E60012" />
    <path
      fill="#FFFFFF"
      d="M8.2 6.5c-1 0-1.8.8-1.8 1.8v7.4c0 1 .8 1.8 1.8 1.8s1.8-.8 1.8-1.8v-3.9l4.8 5.1c.3.35.8.55 1.3.55 1 0 1.8-.8 1.8-1.8V8.3c0-1-.8-1.8-1.8-1.8s-1.8.8-1.8 1.8v3.9L9.5 7.05c-.3-.35-.8-.55-1.3-.55z"
    />
  </svg>
);


const mondaySvg = (sz: string) => (
  <svg viewBox="0 0 24 24" className={sz} role="img" aria-label="Monday.com">
    <path stroke="#FF3D57" strokeWidth="3.4" strokeLinecap="round" fill="none" d="M9.5 7 7 15" />
    <path stroke="#FFCB00" strokeWidth="3.4" strokeLinecap="round" fill="none" d="M14 6 10.5 16" />
    <circle cx="17" cy="15.5" r="2.1" fill="#00CA72" />
  </svg>
);


const fastmailSvg = (sz: string) => (
  <svg viewBox="0 0 24 24" className={sz} role="img" aria-label="Fastmail (approximation)">
    <circle cx="12" cy="12" r="12" fill="#0067B9" />
    <rect x="5.5" y="8.5" width="13" height="8" rx="1.2" fill="#FFFFFF" />
    <path fill="none" stroke="#0067B9" strokeWidth="1.1" d="M5.8 9l6.2 4.3L18.2 9" />
  </svg>
);

const krakenSvg = (sz: string) => (
  <svg viewBox="0 0 24 24" className={sz} role="img" aria-label="Kraken">
    <path fill="#5741D9" d="M12 3a8 8 0 0 0-8 8v3h16v-3a8 8 0 0 0-8-8z" />
    <rect x="4.5" y="12" width="3" height="6.5" rx="1.5" fill="#5741D9" />
    <rect x="9" y="12" width="3" height="8" rx="1.5" fill="#5741D9" />
    <rect x="13.5" y="12" width="3" height="8" rx="1.5" fill="#5741D9" />
    <rect x="17.5" y="12" width="3" height="6.5" rx="1.5" fill="#5741D9" />
    <ellipse cx="9.2" cy="9.5" rx="1.3" ry="1.6" fill="#FFFFFF" />
    <ellipse cx="14.8" cy="9.5" rx="1.3" ry="1.6" fill="#FFFFFF" />
  </svg>
);


const bybitSvg = (sz: string) => (
  <svg
    viewBox="0 0 32 32"
    className={`${sz} text-black dark:text-white`}
    role="img"
    aria-label="Bybit"
  >
    {/* BYB Letters in currentColor (Black in light mode, White in dark mode) */}
    <g fill="currentColor">
      {/* B */}
      <path d="M 3.0 11.5 H 6.4 C 7.4 11.5 8.0 12.0 8.0 12.8 C 8.0 13.4 7.6 13.9 6.8 14.1 C 7.8 14.3 8.3 14.9 8.3 15.8 C 8.3 16.8 7.5 17.5 6.3 17.5 H 3.0 V 11.5 Z M 4.6 12.8 V 13.9 H 6.1 C 6.5 13.9 6.7 13.7 6.7 13.3 C 6.7 13.0 6.5 12.8 6.1 12.8 H 4.6 Z M 4.6 15.0 V 16.2 H 6.2 C 6.6 16.2 6.9 15.9 6.9 15.6 C 6.9 15.2 6.6 15.0 6.2 15.0 H 4.6 Z" />
      {/* Y */}
      <path d="M 9.0 11.5 H 10.6 L 12.0 14.2 L 13.4 11.5 H 15.0 L 12.8 15.2 V 17.5 H 11.2 V 15.2 Z" />
      {/* B */}
      <path d="M 15.2 11.5 H 18.6 C 19.6 11.5 20.2 12.0 20.2 12.8 C 20.2 13.4 19.8 13.9 19.0 14.1 C 20.0 14.3 20.5 14.9 20.5 15.8 C 20.5 16.8 19.7 17.5 18.5 17.5 H 15.2 V 11.5 Z M 16.8 12.8 V 13.9 H 18.3 C 18.7 13.9 18.9 13.7 18.9 13.3 C 18.9 13.0 18.7 12.8 18.3 12.8 H 16.8 Z M 16.8 15.0 V 16.2 H 18.4 C 18.8 16.2 19.1 15.9 19.1 15.6 C 19.1 15.2 18.8 15.0 18.4 15.0 H 16.8 Z" />
    </g>

    {/* Signature Tall Yellow 'I' Bar */}
    <rect x="21.2" y="8.0" width="1.7" height="9.5" fill="#F7A600" rx="0.2" />

    {/* T Letter in currentColor */}
    <path fill="currentColor" d="M 24.0 11.5 H 29.0 V 12.9 H 27.3 V 17.5 H 25.7 V 12.9 H 24.0 V 11.5 Z" />
  </svg>
);


const metamaskSvg = (sz: string) => (
  <img src={metamaskImg} alt="MetaMask" className={`${sz} object-contain`} />
);


const figmaSvg = (sz: string) => (
  <img src={figmaImg} alt="Figma" className={`${sz} object-contain`} />
);


const protonmailSvg = (sz: string) => (
  <img src={protonmailImg} alt="Proton Mail" className={`${sz} object-contain`} />
);


const coinbaseSvg = (sz: string) => (
  <svg viewBox="0 0 24 24" className={sz} role="img" aria-label="Coinbase">
    <circle cx="12" cy="12" r="12" fill="#0052FF" />
    <path
      fill="#FFFFFF"
      d="M9.2 15.6a3.6 3.6 0 1 1 0-7.2h5.6v2h-5.6a1.6 1.6 0 1 0 0 3.2h5.6v2z"
    />
  </svg>
);


const payoneerSvg = (sz: string) => (
  <div
    className={`relative ${sz} rounded-full`}
    role="img"
    aria-label="Payoneer"
    style={{
      background:
        "conic-gradient(from 200deg, #FF4713, #FFB800, #8FD400, #00A9E0, #7B2FF7, #FF2D78, #FF4713)",
    }}
  >
    <div className="absolute rounded-full bg-white" style={{ inset: "20%" }} />
  </div>
);

/* =========================================================
   REGISTRY
   ========================================================= */

type RegistryEntry = { keys: string[] } & (
  | { kind: "package"; slug: string }
  | { kind: "custom"; render: (sz: string) => ReactNode }
);

const registry: RegistryEntry[] = [
  // ---- Tier 1: live in simple-icons, resolved by slug ----
  { keys: ["protondrive"], kind: "package", slug: "protondrive" },
  { keys: ["protonvpn", "protonvpncolo"], kind: "package", slug: "protonvpn" },
  { keys: ["instagram", "insta", "ig"], kind: "package", slug: "instagram" },
  { keys: ["twitter", "x", "xcom"], kind: "package", slug: "x" },
  { keys: ["paypal"], kind: "package", slug: "paypal" },
  { keys: ["zoom"], kind: "package", slug: "zoom" },
  { keys: ["1password", "onepassword"], kind: "package", slug: "1password" },
  { keys: ["lastpass"], kind: "package", slug: "lastpass" },
  { keys: ["namecheap"], kind: "package", slug: "namecheap" },
  { keys: ["stripe"], kind: "package", slug: "stripe" },
  { keys: ["okta"], kind: "package", slug: "okta" },
  { keys: ["auth0", "auth0colo"], kind: "package", slug: "auth0" },
  { keys: ["sap"], kind: "package", slug: "sap" },
  { keys: ["steam"], kind: "package", slug: "steam" },
  { keys: ["perplexity", "colorperplexity"], kind: "package", slug: "perplexity" },
  { keys: ["clickup"], kind: "package", slug: "clickup" },
  { keys: ["linear"], kind: "package", slug: "linear" },
  { keys: ["wix"], kind: "package", slug: "wix" },
  { keys: ["wise", "wisecolo"], kind: "package", slug: "wise" },
  { keys: ["okx"], kind: "package", slug: "okx" },
  { keys: ["kucoin"], kind: "package", slug: "kucoin" },
  { keys: ["roblox"], kind: "package", slug: "roblox" },
  { keys: ["playstation", "playstationnetwork", "psn"], kind: "package", slug: "playstation" },
  { keys: ["2fas"], kind: "package", slug: "2fas" },
  { keys: ["accenture"], kind: "package", slug: "accenture" },

  // ---- Tier 2: removed from simple-icons (or overridden for real multi-color), archived/authored paths ----
  { keys: ["amazon", "amazone"], kind: "custom", render: amazonSvg },
  { keys: ["aws", "amazonaws", "amazonwebservices"], kind: "custom", render: awsSvg },
  { keys: ["adobe", "adabie", "adobi", "adobie"], kind: "custom", render: adobeSvg },
  { keys: ["slack"], kind: "custom", render: slackSvg },
  { keys: ["microsoft", "outlook"], kind: "custom", render: microsoftSvg },
  { keys: ["google"], kind: "custom", render: googleSvg },
  { keys: ["openai", "open-ai"], kind: "custom", render: openAiSvg },
  { keys: ["canva"], kind: "custom", render: canvaSvg },
  { keys: ["twilio"], kind: "custom", render: twilioSvg },
  { keys: ["heroku"], kind: "custom", render: herokuSvg },
  { keys: ["xbox", "xboxmicrosoftaccount", "xboxaccount", "xboxlive"], kind: "custom", render: xboxSvg },
  { keys: ["nintendo"], kind: "custom", render: nintendoSvg },
  { keys: ["coinbase"], kind: "custom", render: coinbaseSvg },
  { keys: ["figma"], kind: "custom", render: figmaSvg },
  { keys: ["protonmail", "protonmailcom", "proton"], kind: "custom", render: protonmailSvg },
  { keys: ["ebay"], kind: "custom", render: ebaySvg },
  { keys: ["gitlab"], kind: "custom", render: gitlabSvg },

  // ---- Tier 3: never in simple-icons, stylized approximation ----
  { keys: ["monday", "mondaycom"], kind: "custom", render: mondaySvg },
  { keys: ["fastmail"], kind: "custom", render: fastmailSvg },
  { keys: ["kraken"], kind: "custom", render: krakenSvg },
  { keys: ["bybit"], kind: "custom", render: bybitSvg },
  { keys: ["metamask"], kind: "custom", render: metamaskSvg },
  { keys: ["payoneer"], kind: "custom", render: payoneerSvg },
];

const registryByKey = new Map<string, RegistryEntry>();
for (const entry of registry) {
  for (const key of entry.keys) {
    registryByKey.set(key, entry);
  }
}

/* =========================================================
   HELPERS FOR THE UNRECOGNIZED-BRAND FALLBACK
   ========================================================= */

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

/* =========================================================
   COMPONENT
   ========================================================= */

export function ServiceIcon({ issuer, size = "md" }: { issuer: string; size?: ServiceIconSize }) {
  const normalizedKey = issuer.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const entry = registryByKey.get(normalizedKey);
  const boxPx = size === "sm" ? "28px" : size === "md" ? "40px" : "56px";

  if (entry) {
    if (entry.kind === "package") {
      const icon = getSimpleIcon(entry.slug);
      // Defensive: if a future simple-icons upgrade removes this slug too,
      // fall through to the generic/initials fallback instead of an empty tile.
      if (icon) {
        return (
          <div
            className="flex shrink-0 items-center justify-center"
            style={{ width: boxPx, height: boxPx }}
            title={icon.title}
            aria-label={icon.title}
          >
            {renderFlatIcon(icon.path, icon.hex, icon.title, svgSizeMap[size])}
          </div>
        );
      }
    } else {
      return (
        <div
          className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg"
          style={{ width: boxPx, height: boxPx }}
          title={issuer}
          aria-label={issuer}
        >
          {entry.render(svgSizeMap[size])}
        </div>
      );
    }
  }

  // Generic service icon fallback (broader local icon set).
  const icon = getServiceIcon(issuer);
  if (icon) {
    const isMonochromeDarkOrLight = isDarkOrWhiteHex(icon.hex);

    if (isMonochromeDarkOrLight) {
      return (
        <div
          className={`flex shrink-0 items-center justify-center text-foreground transition-colors ${sizeMap[size]}`}
          title={icon.title}
          aria-label={icon.title}
        >
          <svg role="img" viewBox="0 0 24 24" className={svgSizeMap[size]} fill="currentColor" aria-hidden="true">
            <path d={icon.path} />
          </svg>
        </div>
      );
    }

    const color = `#${icon.hex}`;
    return (
      <div
        className={`flex shrink-0 items-center justify-center ${sizeMap[size]}`}
        style={{ color }}
        title={icon.title}
        aria-label={icon.title}
      >
        <svg role="img" viewBox="0 0 24 24" className={svgSizeMap[size]} fill="currentColor" aria-hidden="true">
          <path d={icon.path} />
        </svg>
      </div>
    );
  }

  // Final fallback: colored initials.
  const color = palette[hashString(issuer) % palette.length];
  return (
    <div
      className={`flex shrink-0 items-center justify-center font-bold uppercase tracking-tight ${sizeMap[size]}`}
      style={{ color }}
      aria-hidden="true"
    >
      {initials(issuer)}
    </div>
  );
}