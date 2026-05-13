import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const pagePath = path.join(rootDir, "app", "(public)", "page.jsx");
const cssPath = path.join(rootDir, "app", "(public)", "page.module.css");

const pageSource = await fs.readFile(pagePath, "utf8");
const cssSource = await fs.readFile(cssPath, "utf8");

assert.ok(
  !pageSource.includes("LazySplineFrame"),
  "Landing page should not import or render the old Spline frame",
);
assert.ok(
  pageSource.includes('src="/orbis-spline-image.png"'),
  "Landing page should render the PNG hero asset",
);
assert.ok(
  pageSource.includes("className={styles.heroImage}"),
  "Hero PNG should use the CSS module responsive class",
);
assert.ok(
  pageSource.includes('alt={home.hero.splineTitle}'),
  "Hero PNG should have accessible alt text",
);

assert.match(cssSource, /\.heroImage\s*\{[\s\S]*?width:\s*clamp\(/);
assert.match(cssSource, /\.heroImage\s*\{[\s\S]*?height:\s*auto;/);
assert.match(cssSource, /\.heroImage\s*\{[\s\S]*?object-fit:\s*contain;/);
assert.match(
  cssSource,
  /@media\s*\(max-width:\s*1100px\)\s*\{[\s\S]*?\.heroImage\s*\{[\s\S]*?display:\s*none;/,
  "Hero PNG should disappear when the layout starts shrinking",
);

console.log("Landing hero PNG is responsive and hidden on smaller screens.");
