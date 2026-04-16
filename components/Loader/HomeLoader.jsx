'use client'

import { useEffect, useState } from 'react'
import Loader from './page'

export default function HomeLoader() {
    const [visible, setVisible] = useState(true)
    const [fadingOut, setFadingOut] = useState(false)

    useEffect(() => {
        const fadeTimer = setTimeout(() => setFadingOut(true), 2500) // começa a desaparecer depois de 2.5 segundos
        const hideTimer = setTimeout(() => setVisible(false), 3000) // esconde completamente depois de 2.5 segundos

        return () => {
            clearTimeout(fadeTimer)
            clearTimeout(hideTimer)
        }
    }, [])

    if (!visible) return null

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            zIndex: 9999,
            opacity: fadingOut ? 0 : 1,
            transition: 'opacity 600ms ease',
        }}>
            <Loader />
        </div>
    )
}