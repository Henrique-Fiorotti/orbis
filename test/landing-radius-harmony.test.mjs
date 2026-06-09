import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readProjectFile(path) {
  return readFileSync(resolve(rootDir, path), "utf8");
}

test("landing surfaces follow the header radius rhythm", () => {
  const header = readProjectFile("components/Header.jsx");
  const pageStyles = readProjectFile("app/(public)/page.module.css");
  const carouselStyles = readProjectFile("components/carousel-10.module.css");
  const pricing = readProjectFile("components/pricing.jsx");
  const contact = readProjectFile("components/saq.jsx");
  const team = readProjectFile("components/creative-team-section.jsx");

  assert.match(header, /rounded-\[10px\]/);
  assert.match(header, /rounded-\[7px\]/);
  assert.match(pageStyles, /\.featureCard[\s\S]*?border-radius:\s*10px/);
  assert.match(carouselStyles, /\.card[\s\S]*?border-radius:\s*10px/);
  assert.match(pricing, /rounded-\[10px\]/);
  assert.match(contact, /borderRadius:\s*"10px"/);
  assert.match(team, /rounded-\[10px\]/);
});

test("landing cards avoid oversized rounded-corner styles", () => {
  const landingSources = [
    readProjectFile("app/(public)/page.module.css"),
    readProjectFile("components/carousel-10.module.css"),
    readProjectFile("components/pricing.jsx"),
    readProjectFile("components/saq.jsx"),
    readProjectFile("components/creative-team-section.jsx"),
  ].join("\n");

  assert.doesNotMatch(landingSources, /border-radius:\s*(?:1\.5rem|16px|20px|24px|30px)/);
  assert.doesNotMatch(landingSources, /rounded-\[(?:1[2-9]|2[0-9]|30)px\]/);
  assert.doesNotMatch(landingSources, /rounded-(?:lg|xl|2xl|3xl)\b/);
});
