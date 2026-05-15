"use client";

import { useRouter } from "next/navigation";
import { LandingLanguageProvider } from "@/components/landing/language-provider";
import LoginCard from "@/components/LoginCard/page";
import { setSmoothScrollLock } from "@/lib/scroll-lock";
import { useEffect, useState } from "react";

const LOGIN_MODAL_SCROLL_LOCK_SOURCE = "login-modal";

export default function LoginModal() {
  const router = useRouter();
  const [closing, setClosing] = useState(false);

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
    };

    setSmoothScrollLock(LOGIN_MODAL_SCROLL_LOCK_SOURCE, true);
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
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
      setSmoothScrollLock(LOGIN_MODAL_SCROLL_LOCK_SOURCE, false);
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
    };
  }, []);

  function preventBackgroundScroll(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleClose() {
    setClosing(true);
    setTimeout(() => router.back(), 320);
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(32px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(32px) scale(0.97); }
        }
      `}</style>

      <div
        onClick={handleClose}
        onWheel={preventBackgroundScroll}
        onTouchMove={preventBackgroundScroll}
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", padding: "16px",
          animation: closing ? "fadeOut 0.3s ease forwards" : "fadeIn 0.25s ease",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          style={{
            animation: closing
              ? "slideDown 0.3s cubic-bezier(0.36, 0, 0.66, -0.56) forwards"
              : "slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <LandingLanguageProvider>
            <LoginCard />
          </LandingLanguageProvider>
        </div>
      </div>
    </>
  );
}
