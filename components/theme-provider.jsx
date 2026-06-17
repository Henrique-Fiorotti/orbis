"use client"

import * as React from "react"

const STORAGE_KEY = "orbis-theme"
const LEGACY_STORAGE_KEYS = ["theme"]
const DARK_QUERY = "(prefers-color-scheme: dark)"
const THEMES = ["light", "dark", "system"]

const ThemeContext = React.createContext({
  theme: "system",
  resolvedTheme: "light",
  systemTheme: "light",
  themes: THEMES,
  setTheme: () => {},
})

function getSystemTheme() {
  if (typeof window === "undefined") {
    return "light"
  }

  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light"
}

function getStoredTheme(defaultTheme) {
  if (typeof window === "undefined") {
    return defaultTheme
  }

  try {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY)

    if (THEMES.includes(storedTheme)) {
      return storedTheme
    }

    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      const legacyTheme = window.localStorage.getItem(legacyKey)

      if (THEMES.includes(legacyTheme)) {
        window.localStorage.setItem(STORAGE_KEY, legacyTheme)
        return legacyTheme
      }
    }

    return defaultTheme
  } catch {
    return defaultTheme
  }
}

function applyTheme(theme, systemTheme, attribute) {
  const resolvedTheme = theme === "system" ? systemTheme : theme
  const root = document.documentElement

  if (attribute === "class") {
    root.classList.remove("light", "dark")
    root.classList.add(resolvedTheme)
  } else {
    root.setAttribute(attribute, resolvedTheme)
  }

  root.style.colorScheme = resolvedTheme
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
}) {
  const normalizedDefaultTheme = enableSystem ? defaultTheme : "light"
  const [theme, setThemeState] = React.useState(() => getStoredTheme(normalizedDefaultTheme))
  const [systemTheme, setSystemTheme] = React.useState(getSystemTheme)

  React.useEffect(() => {
    setThemeState(getStoredTheme(normalizedDefaultTheme))
    setSystemTheme(getSystemTheme())
  }, [normalizedDefaultTheme])

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(DARK_QUERY)
    const updateSystemTheme = () => setSystemTheme(getSystemTheme())

    updateSystemTheme()
    mediaQuery.addEventListener("change", updateSystemTheme)

    return () => mediaQuery.removeEventListener("change", updateSystemTheme)
  }, [])

  React.useEffect(() => {
    applyTheme(theme, systemTheme, attribute)
  }, [attribute, systemTheme, theme])

  const setTheme = React.useCallback((nextTheme) => {
    setThemeState((currentTheme) => {
      const themeValue = typeof nextTheme === "function" ? nextTheme(currentTheme) : nextTheme
      const normalizedTheme = THEMES.includes(themeValue) ? themeValue : "system"

      try {
        window.localStorage.setItem(STORAGE_KEY, normalizedTheme)
      } catch {
        // localStorage can be unavailable in restricted browser contexts.
      }

      return normalizedTheme
    })
  }, [])

  const value = React.useMemo(() => {
    const resolvedTheme = theme === "system" ? systemTheme : theme

    return {
      theme,
      setTheme,
      resolvedTheme,
      systemTheme,
      themes: THEMES,
    }
  }, [setTheme, systemTheme, theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return React.useContext(ThemeContext)
}
