"use client";

import Link from "next/link";

import { useLandingLanguage } from "@/components/landing/language-provider";
import ThemeAwareImage from "@/components/landing/theme-aware-image";

export default function HeroDashboard() {
  const { copy } = useLandingLanguage();
  const dashboard = copy.dashboardPreview;

  return (
    <div className="w-full flex flex-col justify-between gap-10 px-6 py-12 text-zinc-950 transition-colors sm:px-10 lg:flex-row lg:items-center lg:gap-14 lg:px-[12%] xl:gap-20 xl:px-[15%] dark:text-zinc-50">
      <div className="flex w-full flex-col justify-between gap-6 lg:basis-[260px] lg:shrink-0 xl:basis-[300px]">
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
            {dashboard.eyebrow}
          </p>
          <h1 className="font-poppins text-[2.25rem]/10! font-thin! sm:text-[33pt]/11!">
            {dashboard.titleLine1} <br />
            {dashboard.titleLine2}
          </h1>
          <p className="max-w-md text-base/6 text-gray-400 sm:text-[15pt]/6 dark:text-zinc-400 mt-3">
            {dashboard.description}
          </p>
        </div>
        <Link
          href="/login"
          prefetch={false}
          scroll={false}
          className="inline-block self-start rounded-[10px] border-2 border-transparent bg-[#7b39ed] px-7 py-[13px] text-center font-[Poppins] text-[0.9rem] font-semibold tracking-[0.01em] text-white transition-[background-color,color,border-color,transform] duration-200 hover:border-[#7b39ed] hover:bg-white hover:text-[#7b39ed]"
        >
          {dashboard.cta}
        </Link>
      </div>
      <div className="flex h-full min-w-0 flex-1 flex-col items-center lg:min-w-[360px] lg:items-end">
        <ThemeAwareImage
          className="h-auto w-full max-w-[600px] object-contain"
          lightSrc="/orbis_dashboard_hero.svg"
          darkSrc="/Orbis-hero-dashboard-dark.svg"
          alt={dashboard.imageAlt}
          width="600"
          height="500"
        />
      </div>
    </div>
  );
}
