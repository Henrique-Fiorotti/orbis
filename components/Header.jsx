'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Globe2Icon, MoonIcon, SunIcon, MenuIcon, XIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useLandingLanguage } from '@/components/landing/language-provider'

export default function Header() {
  const { resolvedTheme, setTheme } = useTheme()
  const { copy, languages, locale, setLocale } = useLandingLanguage()
  const [mounted, setMounted] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [visible, setVisible] = React.useState(true)
  const lastScrollY = React.useRef(0)
  const visibleRef = React.useRef(true)
  const frameRef = React.useRef(0)

  React.useEffect(() => setMounted(true), [])

  React.useEffect(() => {
    const updateVisibility = () => {
      frameRef.current = 0
      const currentY = window.scrollY
      let nextVisible = true

      if (currentY < 10) {
        nextVisible = true
      } else if (currentY > lastScrollY.current) {
        nextVisible = false
      } else {
        nextVisible = true
      }

      lastScrollY.current = currentY

      if (visibleRef.current !== nextVisible) {
        visibleRef.current = nextVisible
        setVisible(nextVisible)
      }
    }

    const handleScroll = () => {
      if (frameRef.current) return
      frameRef.current = requestAnimationFrame(updateVisibility)
    }

    window.addEventListener('scroll', handleScroll, { passive: true }) 
    return () => {
      window.removeEventListener('scroll', handleScroll)

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  const isDark = resolvedTheme === 'dark'
  const navLinks = copy.header.nav

  const scrollToLandingHash = React.useCallback((href) => {
    if (typeof window === 'undefined') return false

    let url

    try {
      url = new URL(href, window.location.origin)
    } catch {
      return false
    }

    if (url.pathname !== '/' || !url.hash) return false

    const targetId = decodeURIComponent(url.hash.slice(1))
    const target = document.getElementById(targetId)

    if (!target) return false

    const search = url.search || window.location.search

    window.history.pushState(
      window.history.state,
      '',
      `${url.pathname}${search}${url.hash}`
    )
    visibleRef.current = true
    setVisible(true)
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })

    return true
  }, [])

  const handleNavClick = (event, href) => {
    if (!scrollToLandingHash(href)) return

    event.preventDefault()
    setMenuOpen(false)
  }

  const handleLanguageChange = (event) => {
    setLocale(event.target.value)
    setMenuOpen(false)
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-[60px] grid grid-cols-[1fr_auto_1fr] items-center px-[5%] gap-6 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-black/[0.08] dark:border-white/[0.08] transition-transform duration-300 ${
          visible ? 'translate-y-0' : '-translate-y-full'
        }`} 
      >
        <Link href="/" aria-label="Orbis">
          <Image
            src="/Orbis.svg"
            alt="Orbis"
            width={31}
            height={28}
            className="h-7 w-auto dark:invert"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.07] rounded-[10px] p-1 ms-4">
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              onClick={(event) => handleNavClick(event, href)}
              className="text-[13.5px] text-black/55 dark:text-white/50 px-3.5 py-1.5 rounded-[7px] border border-transparent hover:bg-white dark:hover:bg-white/[0.08] hover:border-black/[0.08] dark:hover:border-white/[0.07] hover:text-[#5e17eb] transition-all duration-150"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 justify-end">
          <div className="hidden sm:flex h-9 items-center gap-1 rounded-[10px] border border-black/[0.08] px-2 text-black/70 transition-all duration-150 hover:border-[#5e17eb]/20 hover:text-[#5e17eb] dark:border-white/[0.08] dark:text-white/70">
            <Globe2Icon size={15} aria-hidden="true" />
            <label htmlFor="landing-language-select" className="sr-only">
              {copy.header.languageSelectLabel}
            </label>
            <select
              id="landing-language-select"
              value={locale}
              onChange={handleLanguageChange}
              aria-label={copy.header.languageSelectLabel}
              className="h-8 cursor-pointer rounded-[8px] bg-white text-[12.5px] font-medium text-black outline-none transition-colors dark:bg-[#09090b] dark:text-white"
            >
              {languages.map((language) => (
                <option
                  key={language.code}
                  value={language.code}
                  lang={language.htmlLang}
                  className="bg-white text-black dark:bg-[#09090b] dark:text-white"
                >
                  {language.nativeName}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={mounted ? (isDark ? copy.header.theme.light : copy.header.theme.dark) : copy.header.theme.toggle}
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
            prefetch={false}
            className="hidden md:flex items-center text-[13.5px] px-4 py-[7px] rounded-[10px] border border-[#5e17eb] text-[#5e17eb] hover:bg-[#5e17eb] hover:text-gray-200 dark:bg-[#5e17eb]/30 dark:hover:bg-[#5e17eb] dark:text-gray-300 transition-all duration-150"
          >
            {copy.header.login}
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? copy.header.menu.close : copy.header.menu.open}
            aria-expanded={menuOpen}
            aria-controls="site-mobile-nav"
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-[10px] border border-black/[0.08] dark:border-white/[0.08] text-black/70 dark:text-white/70 transition-all duration-150"
          >
            {menuOpen ? <XIcon size={16} /> : <MenuIcon size={16} />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div
          id="site-mobile-nav"
          className="fixed top-[60px] left-0 right-0 z-40 flex flex-col gap-1 px-[5%] pt-3 pb-5 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-black/[0.08] dark:border-white/[0.08] md:hidden"
        >
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              onClick={(event) => handleNavClick(event, href)}
              className="text-[18px] text-black dark:text-white px-3.5 py-2.5 rounded-[10px] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-[#5e17eb] transition-all duration-150"
            >
              {label}
            </Link>
          ))}
          <div className="mt-2 flex items-center justify-between gap-3 rounded-[10px] border border-black/[0.08] px-3.5 py-2.5 dark:border-white/[0.08]">
            <label
              htmlFor="landing-mobile-language-select"
              className="text-[15px] text-black/70 dark:text-white/70 dark:bg-black"
            >
              {copy.header.languageLabel}
            </label>
            <select
              id="landing-mobile-language-select"
              value={locale}
              onChange={handleLanguageChange}
              aria-label={copy.header.languageSelectLabel}
              className="min-w-28 rounded-[8px] border border-black/[0.08] bg-white px-2 py-1.5 text-[14px] text-black outline-none transition-colors dark:border-white/[0.08] dark:bg-[#09090b] dark:text-white"
            >
              {languages.map((language) => (
                <option
                  key={language.code}
                  value={language.code}
                  lang={language.htmlLang}
                  className="bg-white text-black dark:bg-[#09090b] dark:text-white"
                >
                  {language.nativeName}
                </option>
              ))}
            </select>
          </div>
          <Link
            href="/login"
            prefetch={false}
            className="mt-2 flex justify-center text-[16px] px-4 py-2.5 rounded-[10px] border-2 border-[#5e17eb] text-[#5e17eb] hover:bg-[#5e17eb] hover:text-white transition-all duration-150"
          >
            {copy.header.login}
          </Link>
        </div>
      )}
    </>
  )
}
