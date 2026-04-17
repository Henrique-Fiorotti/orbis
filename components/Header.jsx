'use client'

import React from 'react'
import Link from 'next/link'
import { MoonIcon, SunIcon, MenuIcon, XIcon } from 'lucide-react'
import { useTheme } from 'next-themes'

export default function Header() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [visible, setVisible] = React.useState(true)
  const lastScrollY = React.useRef(0)

  React.useEffect(() => setMounted(true), [])

  React.useEffect(() => {
  
    const handleScroll = () => { // scroll de mostrar/esconder o header
      const currentY = window.scrollY

      if (currentY < 10) { // Sempre mostrar o header quando estiver no topo da página
        setVisible(true)
      } else if (currentY > lastScrollY.current) { // Esconde o header ao rolar para baixo
        setVisible(false)
      } else { // Mostra o header ao rolar para cima
        setVisible(true)
      }

      lastScrollY.current = currentY
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true }) 
    return () => window.removeEventListener('scroll', handleScroll) 
  }, [])

  const isDark = resolvedTheme === 'dark'

  const navLinks = [
    { label: 'Início', href: '/#inicio' },
    { label: 'Sobre', href: '/#sobre' },
    { label: 'Contato', href: '/contact' },
  ]

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-[60px] grid grid-cols-[1fr_auto_1fr] items-center px-[5%] gap-6 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-black/[0.08] dark:border-white/[0.08] transition-transform duration-300 ${
          visible ? 'translate-y-0' : '-translate-y-full' // Esconde o header quando não estiver visível
        }`} 
      >
        {/* Logo */}
        <Link href="/">
          <img src="/Orbis.svg" alt="Orbis" className="h-7 dark:invert" />
        </Link>

        {/* Nav — desktop */}
        <nav className="hidden md:flex items-center gap-0.5 bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.07] rounded-[10px] p-1 ms-4">
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-[13.5px] text-black/55 dark:text-white/50 px-3.5 py-1.5 rounded-[7px] border border-transparent hover:bg-white dark:hover:bg-white/[0.08] hover:border-black/[0.08] dark:hover:border-white/[0.07] hover:text-[#5e17eb] transition-all duration-150"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-[10px] border border-black/[0.08] dark:border-white/[0.08] text-black/70 dark:text-white/70 hover:bg-[#5e17eb]/[0.08] hover:border-[#5e17eb]/20 hover:text-[#5e17eb] transition-all duration-150"
          >
            {mounted ? (
              isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />
            ) : (
              <MoonIcon size={16} className="opacity-0" />
            )}
          </button>

          <Link
            href="/login"
            className="hidden md:flex items-center text-[13.5px] px-4 py-[7px] rounded-[10px] border border-[#5e17eb] text-[#5e17eb] hover:bg-[#5e17eb] hover:text-white transition-all duration-150"
          >
            Entrar
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-[10px] border border-black/[0.08] dark:border-white/[0.08] text-black/70 dark:text-white/70 transition-all duration-150"
          >
            {menuOpen ? <XIcon size={16} /> : <MenuIcon size={16} />}
          </button>
        </div>
      </header>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="fixed top-[60px] left-0 right-0 z-40 flex flex-col gap-1 px-[5%] pt-3 pb-5 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-black/[0.08] dark:border-white/[0.08] md:hidden">
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="text-[18px] text-black dark:text-white px-3.5 py-2.5 rounded-[10px] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-[#5e17eb] transition-all duration-150"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/login"
            className="mt-2 flex justify-center text-[16px] px-4 py-2.5 rounded-[10px] border-2 border-[#5e17eb] text-[#5e17eb] hover:bg-[#5e17eb] hover:text-white transition-all duration-150"
          >
            Entrar
          </Link>
        </div>
      )}
    </>
  )
}