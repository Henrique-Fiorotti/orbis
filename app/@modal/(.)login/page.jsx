"use client";

import { useRouter } from "next/navigation";
import LoginCard from "@/components/LoginCard/page";
import { useEffect } from "react";

export default function LoginModal() {
  const router = useRouter();

  // Trava o scroll da home enquanto o modal está aberto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      onClick={() => router.back()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)",
        padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{boxShadow: "0 8px 40px rgba(0,0,0,0.12)", borderRadius: "25px" }}>
        <LoginCard />
      </div>
    </div>
  );
}