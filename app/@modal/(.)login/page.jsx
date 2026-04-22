"use client";

import { useRouter } from "next/navigation";
import LoginCard from "@/components/LoginCard/page";
import { useEffect, useState } from "react";

export default function LoginModal() {
  const router = useRouter();
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

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
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", padding: "16px",
          animation: closing ? "fadeOut 0.3s ease forwards" : "fadeIn 0.25s ease",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: closing
              ? "slideDown 0.3s cubic-bezier(0.36, 0, 0.66, -0.56) forwards"
              : "slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <LoginCard />
        </div>
      </div>
    </>
  );
}