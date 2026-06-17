import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readProjectFile(path) {
  return readFileSync(resolve(rootDir, path), "utf8");
}

test("theme provider persists explicit light and dark choices in the Orbis storage key", () => {
  const provider = readProjectFile("components/theme-provider.jsx");

  assert.match(provider, /const STORAGE_KEY = "orbis-theme"/);
  assert.match(provider, /const LEGACY_STORAGE_KEYS = \["theme"\]/);
  assert.match(provider, /window\.localStorage\.setItem\(STORAGE_KEY, normalizedTheme\)/);
  assert.match(provider, /THEMES\.includes\(storedTheme\)/);
  assert.match(provider, /THEMES\.includes\(legacyTheme\)/);
});

test("root layout applies the persisted theme before the interface paints", () => {
  const layout = readProjectFile("app/layout.jsx");

  assert.match(layout, /const storageKey = "orbis-theme";/);
  assert.match(layout, /const legacyStorageKeys = \["theme"\];/);
  assert.match(layout, /strategy="beforeInteractive"/);
  assert.match(layout, /root\.classList\.remove\("light", "dark"\)/);
  assert.match(layout, /root\.classList\.add\(resolvedTheme\)/);
  assert.match(layout, /root\.style\.colorScheme = resolvedTheme/);
});
