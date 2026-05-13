import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const headerPath = path.join(process.cwd(), "components", "Header.jsx");
const source = await fs.readFile(headerPath, "utf8");

const desktopSelect = source.match(
  /id="landing-language-select"[\s\S]*?className="([^"]+)"/,
)?.[1];
const mobileSelect = source.match(
  /id="landing-mobile-language-select"[\s\S]*?className="([^"]+)"/,
)?.[1];
const optionClass = source.match(/<option[\s\S]*?className="([^"]+)"/)?.[1];

assert.ok(desktopSelect, "Desktop language select should have classes");
assert.ok(mobileSelect, "Mobile language select should have classes");
assert.ok(optionClass, "Language options should have classes");

for (const [name, className] of [
  ["desktop select", desktopSelect],
  ["mobile select", mobileSelect],
]) {
  assert.match(className, /\bbg-white\b/, `${name} should define a light background`);
  assert.ok(
    className.split(/\s+/).includes("dark:bg-[#09090b]"),
    `${name} should define a dark background`,
  );
  assert.match(className, /\btext-black\b/, `${name} should define light text`);
  assert.match(className, /\bdark:text-white\b/, `${name} should define dark text`);
}

assert.match(optionClass, /\bbg-white\b/, "Options should define a light background");
assert.ok(
  optionClass.split(/\s+/).includes("dark:bg-[#09090b]"),
  "Options should define a dark background",
);
assert.match(optionClass, /\btext-black\b/, "Options should define light text");
assert.match(optionClass, /\bdark:text-white\b/, "Options should define dark text");

console.log("Header language select follows light and dark theme classes.");
