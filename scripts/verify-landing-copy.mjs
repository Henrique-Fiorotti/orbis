import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const rootDir = process.cwd();
const translationsPath = path.join(rootDir, "components", "landing", "translations.js");
const source = await fs.readFile(translationsPath, "utf8");

const module = new vm.SourceTextModule(source, {
  identifier: translationsPath,
  context: vm.createContext({
    console,
    String,
  }),
});

await module.link(() => {
  throw new Error("Unexpected import in translations.js");
});
await module.evaluate();

const { LANDING_COPY } = module.namespace;
const locales = ["pt", "en", "es"];

const requiredPaths = [
  "contact.faqTitle",
  "contact.formTitle",
  "contact.formDescription",
  "contact.fields.name",
  "contact.fields.email",
  "contact.fields.subject",
  "contact.fields.message",
  "contact.validation.name",
  "contact.validation.email",
  "contact.validation.subject",
  "contact.validation.message",
  "contact.successMessage",
  "contact.errorMessage",
  "contact.submit",
  "contact.sending",
  "contact.faqs",
  "contact.cards.whatsapp",
  "contact.cards.email",
  "login.greeting",
  "login.subtitle",
  "login.fields.email",
  "login.fields.password",
  "login.forgotPassword",
  "login.submit",
  "login.sessionError",
  "login.showPassword",
  "login.hidePassword",
  "login.privacy.agreementBefore",
  "login.privacy.linkText",
  "login.privacy.title",
  "login.privacy.lastUpdated",
  "login.privacy.closeLabel",
  "login.privacy.confirm",
  "login.privacy.sections",
];

function getPath(sourceObject, pathExpression) {
  return pathExpression
    .split(".")
    .reduce((current, key) => current?.[key], sourceObject);
}

function assertText(value, pathExpression, locale) {
  assert.equal(
    typeof value,
    "string",
    `${locale}.${pathExpression} should be a string`,
  );
  assert.notEqual(
    value.trim(),
    "",
    `${locale}.${pathExpression} should not be empty`,
  );
}

for (const locale of locales) {
  const copy = LANDING_COPY[locale];
  assert.ok(copy, `Missing ${locale} landing copy`);

  for (const pathExpression of requiredPaths) {
    const value = getPath(copy, pathExpression);
    assert.ok(value !== undefined, `Missing ${locale}.${pathExpression}`);

    if (!Array.isArray(value) && typeof value !== "object") {
      assertText(value, pathExpression, locale);
    }
  }

  assert.equal(copy.contact.faqs.length, 5, `${locale}.contact.faqs should have 5 items`);
  for (const [index, faq] of copy.contact.faqs.entries()) {
    assertText(faq.question, `contact.faqs[${index}].question`, locale);
    assertText(faq.answer, `contact.faqs[${index}].answer`, locale);
  }

  assert.equal(
    copy.login.privacy.sections.length,
    8,
    `${locale}.login.privacy.sections should have 8 items`,
  );
  for (const [index, section] of copy.login.privacy.sections.entries()) {
    assertText(section.title, `login.privacy.sections[${index}].title`, locale);
    assertText(section.text, `login.privacy.sections[${index}].text`, locale);
  }
}

console.log("Landing contact/login copy is complete for pt, en, and es.");
