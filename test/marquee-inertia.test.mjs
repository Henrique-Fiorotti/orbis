import assert from "node:assert/strict";
import test from "node:test";

import { getMarqueeInertiaFrame, normalizeMarqueeOffset } from "../lib/marquee-inertia.mjs";

test("getMarqueeInertiaFrame moves offset forward while reducing velocity", () => {
  const frame = getMarqueeInertiaFrame({
    elapsedMs: 16,
    offset: 120,
    velocity: 0.8,
  });

  assert.ok(frame.offset > 120);
  assert.ok(frame.velocity > 0);
  assert.ok(frame.velocity < 0.8);
  assert.equal(frame.done, false);
});

test("getMarqueeInertiaFrame stops tiny velocities", () => {
  const frame = getMarqueeInertiaFrame({
    elapsedMs: 16,
    offset: 120,
    velocity: 0.01,
  });

  assert.equal(frame.offset, 120);
  assert.equal(frame.velocity, 0);
  assert.equal(frame.done, true);
});

test("normalizeMarqueeOffset keeps drag offsets inside one loop width", () => {
  assert.equal(normalizeMarqueeOffset(50, 300), 50);
  assert.equal(normalizeMarqueeOffset(350, 300), 50);
  assert.equal(normalizeMarqueeOffset(-50, 300), 250);
  assert.equal(normalizeMarqueeOffset(-650, 300), 250);
});

test("normalizeMarqueeOffset leaves offsets unchanged until loop width is known", () => {
  assert.equal(normalizeMarqueeOffset(350, 0), 350);
});
