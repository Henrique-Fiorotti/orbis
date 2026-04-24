import Link from "next/link";

import ThemeAwareImage from "@/components/landing/theme-aware-image";

export default function HeroDashboard() {
  return (
    <div className="w-full flex justify-between gap-12 px-[15%] py-12 text-zinc-950 transition-colors dark:text-zinc-50">
      <div className="w-1/4 flex flex-col justify-between gap-6">
        <div>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              color: "var(--landing-accent-label, #7c3aed)",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Interface grafica
          </p>
          <h1 className="font-poppins text-[33pt]/11! font-thin!">
            Dashboard <br />
            Preventivo
          </h1>
          <p className="text-[15pt]/6 text-gray-400 dark:text-zinc-400">
            Gestao geral das suas maquinas, interface intuitiva, sua empresa na sua
            tela.
          </p>
        </div>
        <Link
          href="/login"
          prefetch={false}
          className="inline-block rounded-[10px] border-2 border-transparent bg-[#7b39ed] px-7 py-[13px] text-center font-[Poppins] text-[0.9rem] font-semibold tracking-[0.01em] text-white transition-[background-color,color,border-color,transform] duration-200 hover:border-[#7b39ed] hover:bg-white hover:text-[#7b39ed]"
        >
          Comece agora
        </Link>
      </div>
      <div className="h-full flex flex-col items-end min-w-[280px] flex-[1.5]">
        <ThemeAwareImage
          className="h-full w-[600px] object-cover"
          lightSrc="/orbis_dashboard_hero.svg"
          darkSrc="/Orbis-hero-dashboard-dark.svg"
          alt="Dashboard Preventivo"
          width="600"
          height="500"
        />
      </div>
    </div>
  );
}
