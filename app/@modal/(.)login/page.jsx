"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
import { LandingLanguageProvider } from "@/components/landing/language-provider";
import LoginCard from "@/components/LoginCard/page";
import { setSmoothScrollLock } from "@/lib/scroll-lock";
import { useEffect, useRef, useState } from "react";

const LOGIN_MODAL_SCROLL_LOCK_SOURCE = "login-modal";

export default function LoginModal() {
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const artRef = useRef(null);

  function handleClose() {
    if (closing) {
      return;
    }

    setClosing(true);
    setTimeout(() => router.back(), 620);
  }

  useEffect(() => {
    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalBodyStyles = {
      overflow: document.body.style.overflow,
      overscrollBehavior: document.body.style.overscrollBehavior,
      paddingRight: document.body.style.paddingRight,
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
    };
    const originalHtmlStyles = {
      overflow: document.documentElement.style.overflow,
      overscrollBehavior: document.documentElement.style.overscrollBehavior,
      scrollBehavior: document.documentElement.style.scrollBehavior,
    };
    const originalScrollRestoration = window.history.scrollRestoration;

    setSmoothScrollLock(LOGIN_MODAL_SCROLL_LOCK_SOURCE, true);
    window.history.scrollRestoration = "manual";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.documentElement.style.scrollBehavior = "auto";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, scrollY);
      document.documentElement.style.overflow = originalHtmlStyles.overflow;
      document.documentElement.style.overscrollBehavior = originalHtmlStyles.overscrollBehavior;
      document.body.style.overflow = originalBodyStyles.overflow;
      document.body.style.overscrollBehavior = originalBodyStyles.overscrollBehavior;
      document.body.style.paddingRight = originalBodyStyles.paddingRight;
      document.body.style.position = originalBodyStyles.position;
      document.body.style.top = originalBodyStyles.top;
      document.body.style.left = originalBodyStyles.left;
      document.body.style.right = originalBodyStyles.right;
      document.body.style.width = originalBodyStyles.width;
      window.scrollTo(0, scrollY);

      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
        document.documentElement.style.scrollBehavior = originalHtmlStyles.scrollBehavior;
        window.history.scrollRestoration = originalScrollRestoration;
        setSmoothScrollLock(LOGIN_MODAL_SCROLL_LOCK_SOURCE, false);
      });
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closing, router]);

  function handlePointerMove(event) {
    const art = artRef.current;

    if (!art) {
      return;
    }

    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;

    art.style.setProperty("--login-art-shift-x", `${x * 28}px`);
    art.style.setProperty("--login-art-shift-y", `${y * 22}px`);
    art.style.setProperty("--login-art-tilt-x", `${y * -5}deg`);
    art.style.setProperty("--login-art-tilt-y", `${x * 7}deg`);
    art.style.setProperty("--login-art-glow-x", `${50 + x * 12}%`);
    art.style.setProperty("--login-art-glow-y", `${50 + y * 12}%`);
  }

  function resetPointerMove() {
    const art = artRef.current;

    if (!art) {
      return;
    }

    art.style.setProperty("--login-art-shift-x", "0px");
    art.style.setProperty("--login-art-shift-y", "0px");
    art.style.setProperty("--login-art-tilt-x", "0deg");
    art.style.setProperty("--login-art-tilt-y", "0deg");
    art.style.setProperty("--login-art-glow-x", "50%");
    art.style.setProperty("--login-art-glow-y", "50%");
  }

  return (
    <>
      <style>{`
        @keyframes loginScreenEnter {
          from { transform: translate3d(0, -105%, 0); }
          to { transform: translate3d(0, 0, 0); }
        }

        @keyframes loginScreenExit {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(0, -105%, 0); }
        }

        @keyframes loginContentIn {
          from { opacity: 0; transform: translate3d(0, 24px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }

        .landing-login-screen {
          --login-grid-dot: rgba(85, 60, 185, 0.42);
          --login-grid-opacity: 0.5;
          position: fixed;
          inset: 0;
          z-index: 100;
          min-height: 100svh;
          overflow: hidden;
          background:
            radial-gradient(circle at 22% 20%, rgba(124, 58, 237, 0.18), transparent 34%),
            linear-gradient(135deg, #ffffff 0%, #f7f3ff 44%, #ffffff 100%);
          color: #18181b;
          transform: translate3d(0, -105%, 0);
          animation: loginScreenEnter 0.72s cubic-bezier(0.2, 0.82, 0.18, 1) forwards;
        }

        .dark .landing-login-screen {
          --login-grid-dot: rgba(167, 139, 250, 0.42);
          --login-grid-opacity: 0.34;
          background:
            radial-gradient(circle at 22% 20%, rgba(140, 82, 255, 0.32), transparent 34%),
            linear-gradient(135deg, #09090b 0%, #130d22 48%, #09090b 100%);
          color: #fafafa;
        }

        .landing-login-screen::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image: radial-gradient(circle, var(--login-grid-dot) 1px, transparent 1px);
          background-size: 53px 36px;
          opacity: var(--login-grid-opacity);
        }

        .landing-login-screen.is-closing {
          animation: loginScreenExit 0.62s cubic-bezier(0.82, 0, 0.88, 0.28) forwards;
        }

        .landing-login-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(360px, 0.92fr);
          align-items: center;
          gap: clamp(36px, 6vw, 88px);
          width: 100%;
          min-height: 100svh;
          padding: clamp(32px, 5vw, 72px) clamp(24px, 8vw, 120px);
        }

        .landing-login-art {
          --login-art-shift-x: 0px;
          --login-art-shift-y: 0px;
          --login-art-tilt-x: 0deg;
          --login-art-tilt-y: 0deg;
          --login-art-glow-x: 50%;
          --login-art-glow-y: 50%;
          position: relative;
          display: flex;
          min-width: 0;
          min-height: min(640px, 72svh);
          align-items: center;
          justify-content: center;
          isolation: isolate;
          opacity: 0;
          animation: loginContentIn 0.58s ease 0.26s forwards;
        }

        .landing-login-art::before {
          content: "";
          position: absolute;
          width: min(520px, 66vw);
          height: min(520px, 66vw);
          border-radius: 999px;
          background: radial-gradient(circle at var(--login-art-glow-x) var(--login-art-glow-y), rgba(124, 58, 237, 0.22), transparent 68%);
          filter: blur(6px);
          transform: translate3d(calc(var(--login-art-shift-x) * -0.35), calc(var(--login-art-shift-y) * -0.35), 0);
          transition: transform 0.35s ease-out, background 0.35s ease-out;
          z-index: -1;
        }

        .landing-login-image {
          width: min(100%, 520px);
          height: auto;
          filter: drop-shadow(0 32px 52px rgba(94, 23, 235, 0.22));
          transform:
            perspective(900px)
            translate3d(var(--login-art-shift-x), var(--login-art-shift-y), 0)
            rotateX(var(--login-art-tilt-x))
            rotateY(var(--login-art-tilt-y));
          transform-style: preserve-3d;
          transition: transform 0.24s ease-out;
          will-change: transform;
        }

        .landing-login-form {
          position: relative;
          z-index: 2;
          display: flex;
          min-width: 0;
          justify-content: center;
          opacity: 0;
          animation: loginContentIn 0.58s ease 0.36s forwards;
        }

        .landing-login-close {
          position: fixed;
          top: clamp(18px, 3vw, 32px);
          right: clamp(18px, 3vw, 32px);
          z-index: 3;
          display: inline-flex;
          width: 42px;
          height: 42px;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(24, 24, 27, 0.1);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.74);
          color: #18181b;
          cursor: pointer;
          backdrop-filter: blur(14px);
          transition: border-color 0.18s ease, color 0.18s ease, transform 0.18s ease, background 0.18s ease;
        }

        .landing-login-close:hover {
          border-color: rgba(124, 58, 237, 0.42);
          color: #7c3aed;
          transform: translateY(-1px);
        }

        .dark .landing-login-close {
          border-color: rgba(255, 255, 255, 0.1);
          background: rgba(9, 9, 11, 0.66);
          color: #f4f4f5;
        }

        @media (max-width: 920px) {
          .landing-login-screen {
            overflow-y: auto;
          }

          .landing-login-grid {
            grid-template-columns: 1fr;
            gap: 18px;
            min-height: 100svh;
            padding: 76px 6vw 38px;
          }

          .landing-login-art {
            min-height: auto;
          }

          .landing-login-image {
            width: min(58vw, 260px);
          }
        }

        @media (max-width: 520px) {
          .landing-login-grid {
            padding-inline: 18px;
          }

          .landing-login-art {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .landing-login-screen,
          .landing-login-screen.is-closing,
          .landing-login-art,
          .landing-login-form {
            animation-duration: 0.01ms;
            animation-delay: 0ms;
          }

          .landing-login-image,
          .landing-login-art::before {
            transform: none;
            transition: none;
          }
        }
      `}</style>

      <div
        className={`landing-login-screen${closing ? " is-closing" : ""}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointerMove}
      >
        <button
          type="button"
          className="landing-login-close"
          onClick={handleClose}
          aria-label="Sair da tela de login"
        >
          <XIcon size={20} aria-hidden="true" />
        </button>

        <div className="landing-login-grid">
          <div
            ref={artRef}
            className="landing-login-art"
            aria-hidden="true"
          >
            <Image
              src="/orbis-spline-heroo.svg"
              alt=""
              className="landing-login-image"
              width={520}
              height={520}
              draggable={false}
              priority
            />
          </div>

          <div className="landing-login-form">
            <LandingLanguageProvider>
              <LoginCard />
            </LandingLanguageProvider>
          </div>
        </div>
      </div>
    </>
  );
}
