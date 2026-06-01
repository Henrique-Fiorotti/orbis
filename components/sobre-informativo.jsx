'use client'
import { useEffect, useState } from "react";
import Image from "next/image";
import { useLandingLanguage } from "@/components/landing/language-provider";
import ThemeAwareImage from "@/components/landing/theme-aware-image";
import Link from "next/link";

import styles from "../app/(public)/page.module.css";

const SR_ORBIS_MEDIA_QUERY = "(min-width: 1030px)";

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
        <section
            className={`${styles.srOrbisInner} flex flex-col min-[1030px]:flex-row min-[1030px]:items-stretch min-h-max md:ms-2 lg:ms-16 xl:ms-24 2xl:ms-90 max-[1029px]:ms-0 max-[1029px]:items-center max-[1029px]:justify-center max-[1029px]:text-center`}
        >
            {/* Lado esquerdo - conteúdo */}
            <div className="w-full max-w-[460px] min-[1030px]:w-[500px] min-[1030px]:max-w-none min-[1030px]:flex-shrink-0 flex flex-col sm:items-left min-[1030px]:items-start px-8 sm:px-12 md:px-10 lg:px-8 py-8 md:py-20 gap-6 md:gap-10 max-[1029px]:mx-auto max-[1029px]:items-center max-[1029px]:text-center">
                <div className="flex items-left gap-1 max-[1029px]:justify-center">
                    <ThemeAwareImage
                        lightSrc="/Orbis_extended.svg"
                        darkSrc="/LogoBrancaGrandeV3.png"
                        alt={about.logoAlt}
                        width={280}
                        height={70}
                        className="w-[200px] sm:w-[240px] md:w-[280px] h-auto"
                    />
                </div>

                <p style={{ fontFamily: "'Poppins', sans-serif" }} className="text-left text-gray-700 dark:text-zinc-300 text-sm sm:text-base leading-relaxed max-w-sm text-center max-[1029px]:text-center">
                    <RichText parts={about.paragraphs[0]} />
                </p>

                <p style={{ fontFamily: "'Poppins', sans-serif" }} className="text-left text-gray-700 dark:text-zinc-300 text-sm sm:text-base leading-relaxed max-w-sm text-center max-[1029px]:text-center">
                    <RichText parts={about.paragraphs[1]} />
                </p>

                <Link
                    href="/login"
                    style={{ width: "170px" }}
                    prefetch={false}
                    scroll={false}
                    className={`${styles.primaryCta} max-[1029px]:self-center`}
                >
                    {about.cta}
                </Link>
            </div>

            {showSrOrbis && (
                <div className="hidden min-[1030px]:flex min-[1030px]:flex-1 min-[1030px]:items-end h-auto min-[1030px]:justify-center min-h-[auto] lg:min-h-[auto] px-4 lg:px-0 lg:me-10 xl:me-20">
                    <Image
                        src="/SrOrbis2.png"
                        alt={about.imageAlt}
                        width={900}
                        height={900}
                        className="object-contain object-bottom w-full max-w-[300px] lg:max-w-[420px] xl:max-w-[540px]"
                    />
                </div>
            )}
        </section>
    );
}
