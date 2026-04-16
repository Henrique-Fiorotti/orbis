// PageLoader.jsx
'use client'

import { useEffect, useState } from 'react'
import Loader from './page'

export default function PageLoader() {
    const [visible, setVisible] = useState(true)  // começa true direto
    const [fadingOut, setFadingOut] = useState(false)

    useEffect(() => {
        const fadeTimer = setTimeout(() => setFadingOut(true), 5000) // começa a desaparecer depois de 5 segundos
        const hideTimer = setTimeout(() => setVisible(false), 5500) // esconde completamente depois de 5.5 segundos

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