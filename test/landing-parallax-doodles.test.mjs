import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readProjectFile(path) {
  return readFileSync(resolve(rootDir, path), "utf8");
}

test("landing page renders parallax doodles around dashboard and process sections", () => {
  const page = readProjectFile("app/(public)/page.jsx");

  assert.match(page, /const LandingParallaxDoodles = dynamic\(\(\) => import\("@\/components\/landing\/parallax-doodles"\)/);
  assert.doesNotMatch(page, /import LandingParallaxDoodles from "@\/components\/landing\/parallax-doodles"/);
  assert.match(page, /styles\.parallaxDoodleSection/);
  assert.match(page, /<LandingParallaxDoodles variant="dashboard" \/>/);
  assert.match(page, /<LandingParallaxDoodles variant="process" \/>/);
  assert.match(page, /<LandingParallaxDoodles variant="pricing" \/>/);
});

test("public landing layout does not block first paint with the home loader", () => {
  const layout = readProjectFile("app/(public)/layout.jsx");

  assert.doesNotMatch(layout, /HomeLoader/);
  assert.doesNotMatch(layout, /components\/Loader\/HomeLoader/);
});

test("landing parallax doodles use GSAP quick transforms with cleanup and reduced motion", () => {
  const component = readProjectFile("components/landing/parallax-doodles.jsx");

  assert.match(component, /import\s+\{\s*gsap\s*\}\s+from "gsap"/);
  assert.match(component, /gsap\.quickTo/);
  assert.match(component, /const\s+section\s*=\s*root\.parentElement\s*\?\?\s*root/);
  assert.match(component, /gsap\.ticker\.add\(handleScroll\)/);
  assert.match(component, /gsap\.ticker\.remove\(handleScroll\)/);
  assert.match(component, /prefers-reduced-motion:\s*reduce/);
  assert.match(component, /\.kill\(\)/);
  assert.match(component, /aria-hidden="true"/);
});

test("landing parallax doodles use the mapped project SVG assets", () => {
  const component = readProjectFile("components/landing/parallax-doodles.jsx");

  assert.match(component, /src:\s*"\/dashboardcustom\.svg"/);
  assert.match(component, /src:\s*"\/footprint\.svg"/);
  assert.match(component, /src:\s*"\/credit_card\.svg"/);
  assert.doesNotMatch(component, /orb-ia\.svg/);
  assert.match(component, /<img/);
  assert.match(component, /draggable=\{false\}/);
});

test("landing parallax doodles sit above content without clipping", () => {
  const pageStyles = readProjectFile("app/(public)/page.module.css");
  const styles = readProjectFile("components/landing/parallax-doodles.module.css");

  assert.match(styles, /\.doodles/);
  assert.match(styles, /pointer-events:\s*none/);
  assert.match(styles, /z-index:\s*30/);
  assert.match(styles, /opacity:\s*(?:1|80%)/);
  assert.doesNotMatch(styles, /filter:\s*invert/);
  assert.match(pageStyles, /\.parallaxDoodleSection/);
  assert.match(pageStyles, /overflow:\s*visible/);
});

test("landing parallax keeps every doodle in the same calm scroll rhythm", () => {
  const component = readProjectFile("components/landing/parallax-doodles.jsx");

  assert.match(component, /src:\s*"\/dashboardcustom\.svg"[\s\S]*?speed:\s*0\.16[\s\S]*?startOffset:\s*\d+/);
  assert.match(component, /src:\s*"\/footprint\.svg"[\s\S]*?speed:\s*0\.18[\s\S]*?startOffset:\s*\d+/);
  assert.match(component, /src:\s*"\/credit_card\.svg"[\s\S]*?speed:\s*0\.14[\s\S]*?startOffset:\s*\d+/);
  assert.match(component, /node\.dataset\.startOffset/);
});

test("landing parallax doodles are positioned to match the section marks", () => {
  const styles = readProjectFile("components/landing/parallax-doodles.module.css");

  assert.match(styles, /\.dashboardCustom/);
  assert.match(styles, /top:\s*clamp\(-72px,\s*-5vw,\s*-42px\)/);
  assert.match(styles, /right:\s*max\(24px,\s*6vw\)/);
  assert.match(styles, /\.processFootprint/);
  assert.match(styles, /left:\s*max\(\d+px,\s*[\d.]+vw\)/);
  assert.match(styles, /width:\s*clamp\(172px,\s*[\d.]+vw,\s*250px\)/);
  assert.match(styles, /\.pricingCreditCard/);
  assert.match(styles, /@media\s*\(max-width:\s*900px\)/);
});
