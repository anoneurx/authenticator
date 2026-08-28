import { writeFileSync } from "node:fs";

const server = (await import(new URL("./.output/server/index.mjs", import.meta.url))).default;
const ctx = { waitUntil() {}, passThroughOnException() {} };
const res = await server.fetch(new Request("http://localhost/"), {}, ctx);
let html = await res.text();
console.log("status", res.status);

html = html.replace(/href="\/\.\/assets\//g, 'href="./assets/');
html = html.replace(/src="\/\.\/assets\//g, 'src="./assets/');
html = html.replace(/href="\/manifest\.json"/g, 'href="./manifest.json"');
html = html.replace(/href="\/favicon\.ico"/g, 'href="./favicon.ico"');
html = html.replace(/href="\/apple-touch-icon\.png"/g, 'href="./apple-touch-icon.png"');
html = html.replace(/background-image:url\(\/assets\//g, 'background-image:url(./assets/');

writeFileSync(new URL("./.output/public/index.html", import.meta.url), html);
console.log("wrote index.html bytes:", html.length);
