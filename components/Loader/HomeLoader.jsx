'use client'

import { useEffect, useState } from 'react'
import Loader from './page'

export default function PageLoader() {
    const [visible, setVisible] = useState(true)
    const [fadingOut, setFadingOut] = useState(false)

    useEffect(() => {
        window.__orbisLandingLoaderComplete = false

        function finishLoading() {
            window.__orbisLandingLoaderComplete = true
            window.dispatchEvent(new CustomEvent('orbis:landing-loader-complete'))
            setVisible(false)
        }

        const fadeTimer = setTimeout(() => setFadingOut(true), 2000)
        const hideTimer = setTimeout(finishLoading, 2500)
        return () => {
            clearTimeout(fadeTimer)
            clearTimeout(hideTimer)
        }
    }, [])

    if (!visible) return null

    return (
        <div
            className="bg-white dark:bg-[#09090b]"
            style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                opacity: fadingOut ? 0 : 1,
                transition: 'opacity 600ms ease',
            }}
        >
            <Loader />
        </div>
    )
}
