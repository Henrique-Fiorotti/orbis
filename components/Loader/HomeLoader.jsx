'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import Loader from './page'

export default function HomeLoader() {
    const [visible, setVisible] = useState(true)
    const [fadingOut, setFadingOut] = useState(false)
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === 'dark'

    useEffect(() => {
        const fadeTimer = setTimeout(() => setFadingOut(true), 2600) // começa a desaparecer depois de 2.5 segundos
        const hideTimer = setTimeout(() => setVisible(false), 3000) // esconde completamente depois de 2.5 segundos

        return () => {
            clearTimeout(fadeTimer)
            clearTimeout(hideTimer)
        }
    }, [])

    if (!visible) return null

    return (
        <div className={`fixed inset-0 flex items-center 
            justify-center z-[9999] bg-white dark:bg-[#09090b] 
            transition-opacity duration-600 ${fadingOut ? 'opacity-0' : 'opacity-100'}`}
            ><Loader />
        </div>)}