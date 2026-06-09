import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readProjectFile(path) {
  return readFileSync(resolve(rootDir, path), "utf8");
}

test("landing feature carousel uses duplicated marquee groups", () => {
  const component = readProjectFile("components/carousel-10.jsx");

  assert.match(component, /import styles from "\.\/carousel-10\.module\.css"/);
  assert.match(component, /styles\.marqueeShell/);
  assert.match(component, /styles\.marqueeTrack/);
  assert.match(component, /MARQUEE_GROUPS\.map/);
  assert.match(component, /MARQUEE_GROUPS\s*=\s*\[-1,\s*0,\s*1\]/);
});

test("landing feature marquee animates slowly and pauses while hovered or focused", () => {
  const styles = readProjectFile("components/carousel-10.module.css");

  assert.match(styles, /@keyframes\s+featureMarquee/);
  assert.match(styles, /animation:\s*featureMarquee\s+var\(--feature-marquee-duration,\s*56s\)\s+linear\s+infinite/);
  assert.match(styles, /\.marqueeShell:(?:hover|focus-within)\s+\.marqueeTrack/);
  assert.match(styles, /animation-play-state:\s*paused/);
});

test("landing feature marquee supports pointer dragging", () => {
  const component = readProjectFile("components/carousel-10.jsx");
  const styles = readProjectFile("components/carousel-10.module.css");

  assert.match(component, /const\s+shellRef\s*=\s*React\.useRef/);
  assert.match(component, /const\s+trackRef\s*=\s*React\.useRef/);
  assert.match(component, /onPointerDown=\{handlePointerDown\}/);
  assert.match(component, /onPointerMove=\{handlePointerMove\}/);
  assert.match(component, /onPointerUp=\{finishPointerDrag\}/);
  assert.match(component, /setPointerCapture/);
  assert.match(component, /releasePointerCapture/);
  assert.match(component, /normalizeMarqueeOffset/);
  assert.match(component, /--marquee-drag-offset/);
  assert.match(component, /styles\.isDragging/);
  assert.match(styles, /touch-action:\s*pan-y/);
  assert.match(styles, /cursor:\s*grab/);
  assert.match(styles, /\.isDragging\s+\.marqueeTrack/);
  assert.match(styles, /cursor:\s*grabbing/);
});

test("landing feature marquee scales the centered card instead of hovered cards", () => {
  const component = readProjectFile("components/carousel-10.jsx");
  const styles = readProjectFile("components/carousel-10.module.css");

  assert.match(component, /updateCenterScale/);
  assert.match(component, /getBoundingClientRect/);
  assert.match(component, /--center-card-scale/);
  assert.doesNotMatch(styles, /\.card:hover\s*{[^}]*transform/s);
  assert.match(styles, /transform:\s*scale\(var\(--center-card-scale,\s*1\)\)/);
});

test("landing feature marquee keeps generous spacing between cards", () => {
  const styles = readProjectFile("components/carousel-10.module.css");

  assert.match(styles, /--feature-card-gap:\s*1\.35rem/);
  assert.match(styles, /gap:\s*(?:var\(--feature-card-gap\)|50px)/);
  assert.match(styles, /padding-left:\s*var\(--feature-card-gap\)/);
});
