"use client"

import * as React from "react"
import { io } from "socket.io-client"

import { getAuthSession } from "@/lib/auth-session"
import { API_URL } from "@/lib/dashboard-api"
import {
  REALTIME_SENSOR_READING_EVENT,
  SENSOR_READING_DEDUP_WINDOW_MS,
  SENSOR_READING_SOCKET_EVENTS,
  buildRealtimeSocketOptions,
  getSensorReadingEventKey,
  getSensorReadingTargetKey,
} from "@/lib/realtime-events.mjs"
import { SMOOTH_SCROLL_LOCK_CHANGE, isSmoothScrollLocked } from "@/lib/scroll-lock"

/** @typedef {import("@/lib/orbis-types").WithChildrenProps} WithChildrenProps */

/**
 * @param {WithChildrenProps} props
 */
export function DashboardRealtimeProvider({ children }) {
  const recentSensorReadingKeysRef = React.useRef(new Map())
  const pendingSensorReadingsRef = React.useRef(new Map())
  const realtimePausedRef = React.useRef(false)

  React.useEffect(() => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      return
    }

    const socket = io(API_URL, buildRealtimeSocketOptions(session.accessToken))
    realtimePausedRef.current = isSmoothScrollLocked()
    let flushTimer = 0

    function dispatchSensorReading(payload) {
      window.dispatchEvent(new CustomEvent(REALTIME_SENSOR_READING_EVENT, { detail: payload }))
    }

    function flushPendingSensorReadings() {
      if (realtimePausedRef.current) {
        return
      }

      const pendingSensorReadings = Array.from(pendingSensorReadingsRef.current.values())
      pendingSensorReadingsRef.current.clear()

      for (const payload of pendingSensorReadings) {
        dispatchSensorReading(payload)
      }
    }

    function handleScrollLockChange(event) {
      realtimePausedRef.current =
        typeof event.detail?.locked === "boolean"
          ? event.detail.locked
          : isSmoothScrollLocked()

      if (!realtimePausedRef.current && pendingSensorReadingsRef.current.size > 0) {
        window.clearTimeout(flushTimer)
        flushTimer = window.setTimeout(flushPendingSensorReadings, 150)
      }
    }

    function handleSensorReading(payload) {
      const eventKey = getSensorReadingEventKey(payload)
      const now = Date.now()
      const recentSensorReadingKeys = recentSensorReadingKeysRef.current

      for (const [key, expiresAt] of recentSensorReadingKeys.entries()) {
        if (expiresAt <= now) {
          recentSensorReadingKeys.delete(key)
        }
      }

      if (eventKey) {
        if (recentSensorReadingKeys.has(eventKey)) {
          return
        }

        recentSensorReadingKeys.set(eventKey, now + SENSOR_READING_DEDUP_WINDOW_MS)
      }

      if (realtimePausedRef.current) {
        const targetKey = getSensorReadingTargetKey(payload) || eventKey || `reading:${now}`
        pendingSensorReadingsRef.current.set(targetKey, payload)
        return
      }

      dispatchSensorReading(payload)
    }

    for (const eventName of SENSOR_READING_SOCKET_EVENTS) {
      socket.on(eventName, handleSensorReading)
    }

    window.addEventListener(SMOOTH_SCROLL_LOCK_CHANGE, handleScrollLockChange)

    return () => {
      for (const eventName of SENSOR_READING_SOCKET_EVENTS) {
        socket.off(eventName, handleSensorReading)
      }

      window.removeEventListener(SMOOTH_SCROLL_LOCK_CHANGE, handleScrollLockChange)
      window.clearTimeout(flushTimer)
      recentSensorReadingKeysRef.current.clear()
      pendingSensorReadingsRef.current.clear()
      socket.disconnect()
    }
  }, [])

  return children
}
