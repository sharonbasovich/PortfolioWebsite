import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";

// The immersive document is the single editable source. Generate the homepage
// with rebased assets so fragments and SVG masks still refer to the root page.
const root = dirname(fileURLToPath(import.meta.url));
const rebase = (value) => {
  if (/^(?:#|\/|[a-z][a-z\d+.-]*:)/i.test(value)) return value;
  return `./${posix.normalize(posix.join("immersive", value))}`;
};
let html = await readFile(join(root, "immersive/index.html"), "utf8");
html = html.replace(/\b(href|src)="([^"]+)"/g,
  (_, attribute, value) => `${attribute}="${rebase(value)}"`);
html = html.replace(/(<script type="importmap">)([\s\S]*?)(<\/script>)/,
  (_, opening, source, closing) => {
    const map = JSON.parse(source);
    for (const key of Object.keys(map.imports || {}))
      map.imports[key] = rebase(map.imports[key]);
    return `${opening}\n      ${JSON.stringify(map)}\n    ${closing}`;
  });
await writeFile(join(root, "index.html"), html, "utf8");
console.log("Generated startup homepage from immersive/index.html");
