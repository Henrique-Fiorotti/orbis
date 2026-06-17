import { Open_Sans, Poppins } from "next/font/google"
import Script from "next/script"
import { ThemeProvider } from "@/components/theme-provider"

import "./globals.css"

/** @typedef {import("@/lib/orbis-types").RootLayoutProps} RootLayoutProps */

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-open-sans",
})

const themeInitScript = `
(() => {
  const storageKey = "orbis-theme";
  const legacyStorageKeys = ["theme"];
  const themes = ["light", "dark", "system"];
  const root = document.documentElement;

  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function getStoredTheme() {
    const storedTheme = window.localStorage.getItem(storageKey);

    if (themes.includes(storedTheme)) {
      return storedTheme;
    }

    for (const legacyKey of legacyStorageKeys) {
      const legacyTheme = window.localStorage.getItem(legacyKey);

      if (themes.includes(legacyTheme)) {
        window.localStorage.setItem(storageKey, legacyTheme);
        return legacyTheme;
      }
    }

    return "system";
  }

  try {
    const theme = getStoredTheme();
    const resolvedTheme = theme === "system" ? getSystemTheme() : theme;

    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  } catch {
    const resolvedTheme = getSystemTheme();

    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }
})();
`

/** @type {import("next").Metadata} */
export const metadata = {
  title: "Orbis - Soluções Preventivas",
  description:
    "A Orbis é uma empresa de tecnologia especializada em soluções preventivas para o futuro.",
}

/**
 * @param {RootLayoutProps} props
 */
export default function RootLayout({ children, modal }) {
  return (
    <html
      lang="pt-BR"
      className={`${poppins.variable} ${openSans.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <Script
          id="orbis-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          {modal}
        </ThemeProvider>
        
      </body>
    </html>
  )
}
