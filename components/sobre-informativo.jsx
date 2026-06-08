'use client'
import { useEffect, useState } from "react";
import Image from "next/image";
import { useLandingLanguage } from "@/components/landing/language-provider";
import ThemeAwareImage from "@/components/landing/theme-aware-image";
import Link from "next/link";

import styles from "../app/(public)/page.module.css";

const SR_ORBIS_MEDIA_QUERY = "(min-width: 1180px)";

function useShowSrOrbis() {
    const [showSrOrbis, setShowSrOrbis] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia(SR_ORBIS_MEDIA_QUERY);
        const updateShowSrOrbis = () => setShowSrOrbis(mediaQuery.matches);

        updateShowSrOrbis();
        mediaQuery.addEventListener("change", updateShowSrOrbis);

        return () => mediaQuery.removeEventListener("change", updateShowSrOrbis);
    }, []);

    return showSrOrbis;
}

function RichText({ parts }) {
    return parts.map((part, index) =>
        part.strong ? (
            <strong key={`${part.text}-${index}`} className="text-black dark:text-white">
                {part.text}
            </strong>
        ) : (
            <span key={`${part.text}-${index}`}>{part.text}</span>
        )
    );
}

export default function SobreInformativo() {
    const { copy } = useLandingLanguage();
    const about = copy.about;
    const showSrOrbis = useShowSrOrbis();

    return (
        <div
            className={`${styles.srOrbisInner} w-full px-[8vw] pt-8 max-[640px]:px-[6vw] md:pt-12`}
        >
            <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center min-[1180px]:flex-row min-[1180px]:items-stretch min-[1180px]:justify-between">
                {/* Lado esquerdo - conteúdo */}
                <div className="flex w-full max-w-[460px] flex-col items-center gap-6 py-8 text-center md:gap-10 md:py-20 min-[1180px]:w-[430px] min-[1180px]:max-w-none min-[1180px]:flex-shrink-0 min-[1180px]:items-start min-[1180px]:text-left">
                    <div className="flex gap-1 min-[1180px]:justify-start">
                        <ThemeAwareImage
                            lightSrc="/Orbis_extended.svg"
                            darkSrc="/LogoBrancaGrandeV3.png"
                            alt={about.logoAlt}
                            width={280}
                            height={70}
                            className="w-[200px] sm:w-[240px] md:w-[280px] h-auto"
                        />
                    </div>

                    <p style={{ fontFamily: "'Poppins', sans-serif" }} className="text-center text-gray-700 dark:text-zinc-300 text-sm sm:text-base leading-relaxed max-w-sm min-[1180px]:text-left">
                        <RichText parts={about.paragraphs[0]} />
                    </p>

                    <p style={{ fontFamily: "'Poppins', sans-serif" }} className="text-center text-gray-700 dark:text-zinc-300 text-sm sm:text-base leading-relaxed max-w-sm min-[1180px]:text-left">
                        <RichText parts={about.paragraphs[1]} />
                    </p>

                    <Link
                        href="/login"
                        style={{ width: "170px" }}
                        prefetch={false}
                        scroll={false}
                        className={`${styles.primaryCta} self-center min-[1180px]:self-start`}
                    >
                        {about.cta}
                    </Link>
                </div>

                {showSrOrbis && (
                    <div className="hidden min-[1180px]:flex min-[1180px]:flex-1 min-[1180px]:items-end min-[1180px]:justify-end">
                        <Image
                            src="/SrOrbis2.png"
                            alt={about.imageAlt}
                            width={900}
                            height={900}
                            className="w-full max-w-[520px] object-contain object-bottom"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
