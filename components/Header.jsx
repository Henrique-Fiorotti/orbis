'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Globe2Icon, MoonIcon, SunIcon, MenuIcon, XIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useLandingLanguage } from '@/components/landing/language-provider'

const LANDING_HEADER_SECTIONS = [
  { id: 'inicio', href: '/#inicio' },
  { id: 'sobre', href: '/#sobre' },
  { id: 'planos', href: '/#planos' },
  { id: 'contact', href: '/#contact' },
]

function getActiveLandingHref() {
  const activationLine = Math.min(window.innerHeight * 0.42, 420)
  let activeHref = '/#inicio'

  for (const { id, href } of LANDING_HEADER_SECTIONS) {
    const section = document.getElementById(id)

    if (!section) continue

    const rect = section.getBoundingClientRect()

    if (rect.top <= activationLine && rect.bottom > 0) {
      activeHref = href
    }
  }

  return activeHref
}

export default function Header() {
  const { resolvedTheme, setTheme } = useTheme()
  const { copy, languages, locale, setLocale } = useLandingLanguage()
  const [mounted, setMounted] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [visible, setVisible] = React.useState(true)
  const [activeHref, setActiveHref] = React.useState('/#inicio')
  const lastScrollY = React.useRef(0)
  const visibleRef = React.useRef(true)
  const activeHrefRef = React.useRef('/#inicio')

  React.useEffect(() => setMounted(true), [])

  React.useEffect(() => {
    const updateActiveHref = () => {
      const nextActiveHref = getActiveLandingHref()

      if (activeHrefRef.current !== nextActiveHref) {
        activeHrefRef.current = nextActiveHref
        setActiveHref(nextActiveHref)
      }
    }

    const updateHeaderState = () => {
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

      updateActiveHref()

      if (visibleRef.current !== nextVisible) {
        visibleRef.current = nextVisible
        setVisible(nextVisible)
      }
    }

    lastScrollY.current = window.scrollY
    updateActiveHref()

    window.addEventListener('scroll', updateHeaderState, { passive: true })
    window.addEventListener('resize', updateActiveHref)
    return () => {
      window.removeEventListener('scroll', updateHeaderState)
      window.removeEventListener('resize', updateActiveHref)
    }
  }, [])

  const isDark = resolvedTheme === 'dark'
  const navLinks = copy.header.nav
  const activeNavTextClass = 'text-[#5E17EB] dark:text-white'
  const defaultNavTextClass = 'text-black/55 dark:text-white/50'

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
    const nextActiveHref = `${url.pathname}${url.hash}`
    activeHrefRef.current = nextActiveHref
    setActiveHref(nextActiveHref)
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
        className={`fixed top-0 left-0 right-0 z-50 flex h-[60px] items-center justify-between gap-3 px-[5%] bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-black/[0.08] dark:border-white/[0.08] transition-transform duration-300 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-6 ${
          visible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <Link href="/" aria-label="Orbis" className='w-fit'>
          <Image
            src="/Orbis.svg"
            alt="Orbis"
            width={31}
            height={28}
            className="h-7 w-auto dark:invert"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.07] rounded-[10px] p-1 ms-4">
          {navLinks.map(({ label, href }) => {
            const active = activeHref === href

            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                onClick={(event) => handleNavClick(event, href)}
                className={`inline-flex h-8 w-[92px] items-center justify-center rounded-[7px] border border-transparent px-3 text-center text-[13.5px] ${active ? activeNavTextClass : defaultNavTextClass} hover:bg-white hover:text-[#5e17eb] dark:hover:bg-white/[0.08] hover:border-black/[0.08] dark:hover:border-white/[0.07] transition-all duration-150`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="ms-auto flex items-center gap-2 justify-end">
          <div className="hidden h-9 w-[134px] items-center gap-1 rounded-[10px] border border-black/[0.08] px-2 text-black/70 transition-all duration-150 hover:border-[#5e17eb]/20 hover:text-[#5e17eb] dark:border-white/[0.08] dark:text-white/70 sm:flex">
            <Globe2Icon size={15} aria-hidden="true" />
            <label htmlFor="landing-language-select" className="sr-only">
              {copy.header.languageSelectLabel}
            </label>
            <select
              id="landing-language-select"
              value={locale}
              onChange={handleLanguageChange}
              aria-label={copy.header.languageSelectLabel}
              className="h-8 min-w-0 flex-1 cursor-pointer rounded-[8px] bg-white text-[12.5px] font-medium text-black outline-none transition-colors dark:bg-[#09090b] dark:text-white"
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
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] border border-black/[0.08] text-black/70 transition-all duration-150 hover:border-[#5e17eb]/20 hover:bg-[#5e17eb]/[0.08] hover:text-[#5e17eb] dark:border-white/[0.08] dark:text-white/70"
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
            scroll={false}
            className="hidden h-9 w-[92px] items-center justify-center rounded-[10px] border border-[#5e17eb] px-4 text-center text-[13.5px] text-[#5e17eb] transition-all duration-150 hover:bg-[#5e17eb] hover:text-gray-200 dark:bg-[#5e17eb]/30 dark:text-gray-300 dark:hover:bg-[#5e17eb] md:flex"
          >
            {copy.header.login}
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? copy.header.menu.close : copy.header.menu.open}
            aria-expanded={menuOpen}
            aria-controls="site-mobile-nav"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/[0.08] text-black/70 transition-all duration-150 dark:border-white/[0.08] dark:text-white/70 md:hidden"
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
          {navLinks.map(({ label, href }) => {
            const active = activeHref === href

            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                onClick={(event) => handleNavClick(event, href)}
                className={`rounded-[10px] px-3.5 py-2.5 text-[18px] ${active ? activeNavTextClass : 'text-black dark:text-white'} transition-all duration-150 hover:bg-black/[0.04] hover:text-[#5e17eb] dark:hover:bg-white/[0.05]`}
              >
                {label}
              </Link>
            )
          })}
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
            scroll={false}
            className="mt-2 flex justify-center text-[16px] px-4 py-2.5 rounded-[10px] border-2 border-[#5e17eb] text-[#5e17eb] hover:bg-[#5e17eb] hover:text-white transition-all duration-150"
          >
            {copy.header.login}
          </Link>
        </div>
      )}
    </>
  )
}
