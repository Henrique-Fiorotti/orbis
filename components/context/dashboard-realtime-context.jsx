"use client"

import * as React from "react"
import { io } from "socket.io-client"

import { getAuthSession } from "@/lib/auth-session"
import { API_URL } from "@/lib/dashboard-api"
import {
  REALTIME_SENSOR_READING_EVENT,
  SENSOR_READING_SOCKET_EVENTS,
  buildRealtimeSocketOptions,
} from "@/lib/realtime-events.mjs"

/** @typedef {import("@/lib/orbis-types").WithChildrenProps} WithChildrenProps */

/**
 * @param {WithChildrenProps} props
 */
export function DashboardRealtimeProvider({ children }) {
  React.useEffect(() => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      return
    }

    const socket = io(API_URL, buildRealtimeSocketOptions(session.accessToken))

    function handleSensorReading(payload) {
      window.dispatchEvent(new CustomEvent(REALTIME_SENSOR_READING_EVENT, { detail: payload }))
    }

    for (const eventName of SENSOR_READING_SOCKET_EVENTS) {
      socket.on(eventName, handleSensorReading)
    }

    return () => {
      for (const eventName of SENSOR_READING_SOCKET_EVENTS) {
        socket.off(eventName, handleSensorReading)
      }

      socket.disconnect()
    }
  }, [])

  return children
}
