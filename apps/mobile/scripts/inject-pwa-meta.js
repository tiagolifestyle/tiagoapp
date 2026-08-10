// `expo export -p web` (output: "single") doesn't run Expo Router's static
// HTML pipeline, so `app/+html.tsx` is never applied. This injects the PWA
// tags (manifest, apple-touch-icon, theme-color) straight into the built
// dist/index.html instead. Run after `expo export`.
const fs = require("node:fs");
const path = require("node:path");

const indexPath = path.join(__dirname, "..", "dist", "index.html");
const html = fs.readFileSync(indexPath, "utf8");

const tags = `
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="icon" href="/favicon.png">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="TiagoLifeStyle">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#0B0B0F">
</head>`;

if (html.includes('rel="manifest"')) {
  process.exit(0); // already injected (re-run safety)
}

fs.writeFileSync(indexPath, html.replace("</head>", tags).replace('lang="en"', 'lang="pt"'));
console.log("PWA meta tags injected into dist/index.html");
