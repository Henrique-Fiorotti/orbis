"use client"

import * as React from "react"

const STORAGE_KEY = "orbis-dashboard-preferences"

const DEFAULT_PREFERENCES = {
  textScale: "padrao",
  smoothScrollEnabled: true,
  orbButtonVisible: true,
  orbButtonPosition: "bottom-right",
}

const TEXT_SCALE_VALUES = {
  compacta: "93.75%",
  padrao: "",
  ampliada: "106.25%",
}

const ORB_BUTTON_POSITION_VALUES = new Set([
  "top-left",
  "top-right",
  "center-left",
  "center-right",
  "bottom-left",
  "bottom-right",
])

const DashboardPreferencesContext = React.createContext(null)

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function normalizePreferences(value) {
  const textScale = Object.prototype.hasOwnProperty.call(TEXT_SCALE_VALUES, value?.textScale)
    ? value.textScale
    : DEFAULT_PREFERENCES.textScale

  return {
    textScale,
    smoothScrollEnabled:
      typeof value?.smoothScrollEnabled === "boolean"
        ? value.smoothScrollEnabled
        : DEFAULT_PREFERENCES.smoothScrollEnabled,
    orbButtonVisible:
      typeof value?.orbButtonVisible === "boolean"
        ? value.orbButtonVisible
        : DEFAULT_PREFERENCES.orbButtonVisible,
    orbButtonPosition: ORB_BUTTON_POSITION_VALUES.has(value?.orbButtonPosition)
      ? value.orbButtonPosition
      : DEFAULT_PREFERENCES.orbButtonPosition,
  }
}

function readStoredPreferences() {
  if (!canUseLocalStorage()) {
    return DEFAULT_PREFERENCES
  }

  try {
    const rawPreferences = window.localStorage.getItem(STORAGE_KEY)

    if (!rawPreferences) {
      return DEFAULT_PREFERENCES
    }

    return normalizePreferences(JSON.parse(rawPreferences))
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function DashboardPreferencesProvider({ children }) {
  const [preferences, setPreferences] = React.useState(readStoredPreferences)

  React.useEffect(() => {
    if (!canUseLocalStorage()) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  }, [preferences])

  React.useEffect(() => {
    const root = document.documentElement
    const previousFontSize = root.style.fontSize
    const previousDashboardTextScale = root.dataset.dashboardTextScale
    const nextFontSize = TEXT_SCALE_VALUES[preferences.textScale]

    if (nextFontSize) {
      root.style.fontSize = nextFontSize
      root.dataset.dashboardTextScale = preferences.textScale
    } else {
      root.style.fontSize = ""
      delete root.dataset.dashboardTextScale
    }

    return () => {
      root.style.fontSize = previousFontSize

      if (previousDashboardTextScale) {
        root.dataset.dashboardTextScale = previousDashboardTextScale
      } else {
        delete root.dataset.dashboardTextScale
      }
    }
  }, [preferences.textScale])

  const value = React.useMemo(
    () => ({
      preferences,
      setTextScale: (textScale) => {
        setPreferences((currentPreferences) =>
          normalizePreferences({ ...currentPreferences, textScale })
        )
      },
      setSmoothScrollEnabled: (smoothScrollEnabled) => {
        setPreferences((currentPreferences) =>
          normalizePreferences({ ...currentPreferences, smoothScrollEnabled })
        )
      },
      setOrbButtonVisible: (orbButtonVisible) => {
        setPreferences((currentPreferences) =>
          normalizePreferences({ ...currentPreferences, orbButtonVisible })
        )
      },
      setOrbButtonPosition: (orbButtonPosition) => {
        setPreferences((currentPreferences) =>
          normalizePreferences({ ...currentPreferences, orbButtonPosition })
        )
      },
      resetPreferences: () => {
        setPreferences(DEFAULT_PREFERENCES)
      },
    }),
    [preferences]
  )

  return (
    <DashboardPreferencesContext.Provider value={value}>
      {children}
    </DashboardPreferencesContext.Provider>
  )
}

export function useDashboardPreferences() {
  const context = React.useContext(DashboardPreferencesContext)

  if (!context) {
    throw new Error("useDashboardPreferences must be used within DashboardPreferencesProvider")
  }

  return context
}

export function useOptionalDashboardPreferences() {
  return React.useContext(DashboardPreferencesContext)
}
