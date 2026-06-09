'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRightIcon, Globe2Icon, MoonIcon, SunIcon, MenuIcon, XIcon } from 'lucide-react'
import { gsap } from 'gsap'
import { useTheme } from '@/components/theme-provider'
import { useLandingLanguage } from '@/components/landing/language-provider'
import { setSmoothScrollLock } from '@/lib/scroll-lock'

const LANDING_HEADER_SECTIONS = [
  { id: 'inicio', href: '/#inicio' },
  { id: 'sobre', href: '/#sobre' },
  { id: 'planos', href: '/#planos' },
  { id: 'contact', href: '/#contact' },
]

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect

function HeaderLoginLink({ className, children, ...props }) {
  const linkRef = React.useRef(null)
  const textRef = React.useRef(null)
  const cloneRef = React.useRef(null)
  const arrowRef = React.useRef(null)
  const timelineRef = React.useRef(null)

  useIsomorphicLayoutEffect(() => {
    const link = linkRef.current
    const text = textRef.current
    const clone = cloneRef.current
    const arrow = arrowRef.current

    if (!link || !text || !clone || !arrow) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion) return undefined

    const context = gsap.context(() => {
      gsap.set(clone, { yPercent: 115, autoAlpha: 1 })
      gsap.set(text, { yPercent: 0, autoAlpha: 1 })
      gsap.set(arrow, { x: -5, autoAlpha: 0 })

      timelineRef.current = gsap.timeline({
        paused: true,
        defaults: { duration: 0.34, ease: 'power3.inOut', overwrite: 'auto' },
      })
        .to(text, { yPercent: -115 }, 0)
        .to(clone, { yPercent: 0 }, 0.02)
        .to(arrow, { x: 0, autoAlpha: 1, duration: 0.22, ease: 'power2.out' }, 0.14)
    }, link)

    return () => {
      timelineRef.current?.kill()
      timelineRef.current = null
      context.revert()
    }
  }, [children])

  const playSplit = () => timelineRef.current?.play()
  const reverseSplit = () => timelineRef.current?.reverse()

  return (
    <Link
      ref={linkRef}
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={playSplit}
      onMouseLeave={reverseSplit}
      onFocus={playSplit}
      onBlur={reverseSplit}
      {...props}
    >
      <span ref={textRef} className="block will-change-transform">
        {children}
      </span>
      <span
        ref={cloneRef}
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center will-change-transform"
      >
        <ArrowRightIcon
          ref={arrowRef}
          size={17}
          strokeWidth={2}
          className="shrink-0 will-change-transform"
        />
      </span>
    </Link>
  )
}

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
  const [menuMounted, setMenuMounted] = React.useState(false)
  const [visible, setVisible] = React.useState(true)
  const [activeHref, setActiveHref] = React.useState('/#inicio')
  const lastScrollY = React.useRef(0)
  const visibleRef = React.useRef(true)
  const activeHrefRef = React.useRef('/#inicio')
  const mobileMenuRef = React.useRef(null)
  const mobileMenuTopRef = React.useRef(null)
  const mobileMenuNavRef = React.useRef(null)
  const mobileMenuFooterRef = React.useRef(null)
  const mobileMenuTimelineRef = React.useRef(null)

  React.useEffect(() => setMounted(true), [])

  React.useEffect(() => {
    if (menuOpen) {
      setMenuMounted(true)
    }
  }, [menuOpen])

  React.useEffect(() => {
    if (!menuMounted) return undefined

    const originalHtmlOverflow = document.documentElement.style.overflow
    const originalBodyOverflow = document.body.style.overflow

    setSmoothScrollLock('landing-mobile-menu', true)
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.documentElement.style.overflow = originalHtmlOverflow
      document.body.style.overflow = originalBodyOverflow
      setSmoothScrollLock('landing-mobile-menu', false)
    }
  }, [menuMounted])

  useIsomorphicLayoutEffect(() => {
    if (!menuMounted) return undefined

    const menu = mobileMenuRef.current
    const top = mobileMenuTopRef.current
    const nav = mobileMenuNavRef.current
    const footer = mobileMenuFooterRef.current

    if (!menu || !top || !nav || !footer) return undefined

    const navItems = Array.from(nav.querySelectorAll('[data-mobile-menu-link]'))
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion) {
      gsap.set([menu, top, navItems, footer], { clearProps: 'all', autoAlpha: 1, y: 0 })
      return undefined
    }

    const context = gsap.context(() => {
      gsap.set(menu, {
        autoAlpha: 0,
        yPercent: -4,
        clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)',
      })
      gsap.set(top, { autoAlpha: 0, y: -10 })
      gsap.set(navItems, { autoAlpha: 0, y: 26 })
      gsap.set(footer, { autoAlpha: 0, y: 18 })

      mobileMenuTimelineRef.current = gsap.timeline({
        paused: true,
        defaults: { ease: 'power3.out', overwrite: 'auto' },
        onReverseComplete: () => {
          setMenuMounted(false)
        },
      })
        .to(menu, {
          autoAlpha: 1,
          yPercent: 0,
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
          duration: 0.42,
        }, 0)
        .to(top, { autoAlpha: 1, y: 0, duration: 0.28 }, 0.12)
        .to(navItems, {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          stagger: { each: 0.055, from: 'start' },
        }, 0.18)
        .to(footer, { autoAlpha: 1, y: 0, duration: 0.32 }, 0.3)

      if (menuOpen) {
        mobileMenuTimelineRef.current.play(0)
      }
    }, menu)

    return () => {
      mobileMenuTimelineRef.current?.kill()
      mobileMenuTimelineRef.current = null
      context.revert()
    }
  }, [menuMounted])

  React.useEffect(() => {
    const timeline = mobileMenuTimelineRef.current

    if (!menuMounted) return

    if (!timeline) {
      if (!menuOpen) {
        setMenuMounted(false)
      }
      return
    }

    if (menuOpen) {
      timeline.play()
    } else {
      timeline.reverse()
    }
  }, [menuMounted, menuOpen])

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
          <div
            className="relative hidden h-9 w-9 items-center justify-center overflow-hidden rounded-[10px] border border-black/[0.08] text-black/70 transition-all duration-150 hover:border-[#5e17eb]/20 hover:bg-[#5e17eb]/[0.08] hover:text-[#5e17eb] dark:border-white/[0.08] dark:text-white/70 sm:flex"
            title={copy.header.languageSelectLabel}
          >
            <Globe2Icon size={16} aria-hidden="true" />
            <label htmlFor="landing-language-select" className="sr-only">
              {copy.header.languageSelectLabel}
            </label>
            <select
              id="landing-language-select"
              value={locale}
              onChange={handleLanguageChange}
              aria-label={copy.header.languageSelectLabel}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
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

          <HeaderLoginLink
            href="/login"
            prefetch={false}
            scroll={false}
            className="hidden h-9 w-[92px] items-center justify-center rounded-[10px] border border-[#5e17eb] px-4 text-center text-[13.5px] text-[#5e17eb] transition-all duration-150 hover:bg-[#5e17eb] hover:text-gray-200 dark:bg-[#5e17eb]/30 dark:text-gray-300 dark:hover:bg-[#5e17eb] md:flex"
          >
            {copy.header.login}
          </HeaderLoginLink>

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

      {menuMounted && (
        <div
          id="site-mobile-nav"
          ref={mobileMenuRef}
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex min-h-dvh flex-col bg-white/95 text-black backdrop-blur-xl will-change-[transform,opacity,clip-path] dark:bg-[#09090b]/95 dark:text-white md:hidden"
        >
          <div ref={mobileMenuTopRef} className="flex h-[60px] shrink-0 items-center justify-between px-[5%]">
            <Link href="/" aria-label="Orbis" onClick={() => setMenuOpen(false)} className="w-fit">
              <Image
                src="/Orbis.svg"
                alt="Orbis"
                width={31}
                height={28}
                className="h-7 w-auto dark:invert"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label={copy.header.menu.close}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-black/[0.08] text-black/70 transition-colors hover:border-[#5e17eb]/20 hover:bg-[#5e17eb]/[0.08] hover:text-[#5e17eb] dark:border-white/[0.08] dark:text-white/70"
            >
              <XIcon size={18} />
            </button>
          </div>

          <nav ref={mobileMenuNavRef} className="flex flex-1 flex-col items-stretch justify-start gap-2 px-[5%] pt-8">
            {navLinks.map(({ label, href }) => {
              const active = activeHref === href

              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={false}
                  data-mobile-menu-link="true"
                  onClick={(event) => handleNavClick(event, href)}
                  className={`flex min-h-16 items-center justify-between rounded-[10px] border px-4 text-[clamp(28px,8vw,56px)] font-semibold leading-none transition-colors ${
                    active
                      ? 'border-[#5e17eb]/25 bg-[#5e17eb]/[0.08] text-[#5e17eb] dark:border-white/[0.14] dark:bg-white/[0.08] dark:text-white'
                      : 'border-transparent text-black hover:border-black/[0.08] hover:bg-black/[0.04] hover:text-[#5E17EB] dark:text-white dark:hover:border-white/[0.08] dark:hover:bg-white/[0.05] dark:hover:text-[#5E17EB]'
                  }`}
                >
                  {label}
                  <ArrowRightIcon size={24} aria-hidden="true" className="shrink-0" />
                </Link>
              )
            })}
          </nav>

          <div ref={mobileMenuFooterRef} className="grid gap-3 px-[5%] pb-7">
            <div className="flex items-center justify-between gap-3 rounded-[10px] border border-black/[0.08] px-3.5 py-2.5 dark:border-white/[0.08]">
              <label
                htmlFor="landing-mobile-language-select"
                className="text-[15px] text-black/70 dark:text-white/70"
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
              onClick={() => setMenuOpen(false)}
              className="flex justify-center rounded-[10px] border-2 border-[#5e17eb] px-4 py-3 text-[16px] text-[#5e17eb] transition-colors hover:bg-[#5e17eb] hover:text-white"
            >
              {copy.header.login}
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
