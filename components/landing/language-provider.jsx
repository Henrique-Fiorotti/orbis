"use client";

import React from "react";

import {
  DEFAULT_LOCALE,
  LANGUAGES,
  getLandingCopy,
  normalizeLocale,
} from "@/components/landing/translations";

const STORAGE_KEY = "orbis:landing-language:v1";
const LandingLanguageContext = React.createContext(null);
const fallbackContext = {
  copy: getLandingCopy(DEFAULT_LOCALE),
  currentLanguage: LANGUAGES[0],
  languages: LANGUAGES,
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
};

function readUrlLocale() {
  if (typeof window === "undefined") return null;

  return normalizeLocale(new URLSearchParams(window.location.search).get("lang"));
}

function readStoredLocale() {
  if (typeof window === "undefined") return null;

  try {
    return normalizeLocale(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function storeLocale(locale) {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {}
}

function syncUrlLocale(locale) {
  const url = new URL(window.location.href);

  if (locale === DEFAULT_LOCALE) {
    url.searchParams.delete("lang");
  } else {
    url.searchParams.set("lang", locale);
  }

  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

export function LandingLanguageProvider({ children }) {
  const [locale, setLocaleState] = React.useState(DEFAULT_LOCALE);
  const originalLangRef = React.useRef(null);
  const originalDirRef = React.useRef(null);

  React.useEffect(() => {
    originalLangRef.current = document.documentElement.lang || "pt-BR";
    originalDirRef.current = document.documentElement.dir || "ltr";
    const initialLocale = readUrlLocale() ?? readStoredLocale() ?? DEFAULT_LOCALE;

    setLocaleState(initialLocale);
    storeLocale(initialLocale);

    const handlePopState = () => {
      setLocaleState(readUrlLocale() ?? readStoredLocale() ?? DEFAULT_LOCALE);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.documentElement.lang = originalLangRef.current ?? "pt-BR";
      document.documentElement.dir = originalDirRef.current ?? "ltr";
    };
  }, []);

  const copy = getLandingCopy(locale);

  React.useEffect(() => {
    document.documentElement.lang = copy.meta.htmlLang;
    document.documentElement.dir = copy.meta.dir;
  }, [copy.meta.dir, copy.meta.htmlLang]);

  const setLocale = React.useCallback((nextLocale) => {
    const normalizedLocale = normalizeLocale(nextLocale) ?? DEFAULT_LOCALE;

    setLocaleState(normalizedLocale);
    storeLocale(normalizedLocale);
    syncUrlLocale(normalizedLocale);
  }, []);

  const value = React.useMemo(
    () => ({
      copy,
      currentLanguage:
        LANGUAGES.find((language) => language.code === locale) ?? LANGUAGES[0],
      languages: LANGUAGES,
      locale,
      setLocale,
    }),
    [copy, locale, setLocale],
  );

  return (
    <LandingLanguageContext.Provider value={value}>
      <div lang={copy.meta.htmlLang} dir={copy.meta.dir}>
        {children}
      </div>
    </LandingLanguageContext.Provider>
  );
}

export function useLandingLanguage() {
  const context = React.useContext(LandingLanguageContext);

  return context ?? fallbackContext;
}
