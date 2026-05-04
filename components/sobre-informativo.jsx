'use client'
import Image from "next/image";
import { useLandingLanguage } from "@/components/landing/language-provider";
import ThemeAwareImage from "@/components/landing/theme-aware-image";
import Link from "next/link";

import styles from "../app/(public)/page.module.css";

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

    return (
        <section
            style={{ background: "var(--landing-alt-bg)" }}
            className="flex flex-col md:flex-row min-h-max bg-[#f0f0f056] dark:bg-zinc-900 md:ms-2 lg:ms-16 xl:ms-24 2xl:ms-90"
        >
            <div className="flex md:hidden w-full justify-center items-end h-[260px] sm:h-[300px] overflow-hidden">
                <Image
                    src="/SrOrbis2.png"
                    alt={about.imageAlt}
                    width={900}
                    height={900}
                    className="object-contain object-bottom h-full w-auto"
                />
            </div>

            <div className="w-full md:w-[460px] lg:w-[500px] md:flex-shrink-0 flex flex-col items-center md:items-start px-8 sm:px-12 md:px-10 lg:px-8 py-8 md:py-20 gap-6 md:gap-10">
                <div className="flex items-left gap-1">
                    <ThemeAwareImage
                        lightSrc="/Orbis_extended.svg"
                        darkSrc="/LogoBrancaGrandeV3.png"
                        alt={about.logoAlt}
                        width={280}
                        height={70}
                        className="w-[200px] sm:w-[240px] md:w-[280px] h-auto"
                    />
                </div>

                <p style={{ fontFamily: "'Poppins', sans-serif" }} className="text-gray-700 dark:text-zinc-300 text-sm sm:text-base leading-relaxed max-w-sm text-center md:text-left">
                    <RichText parts={about.paragraphs[0]} />
                </p>

                <p style={{ fontFamily: "'Poppins', sans-serif" }} className="text-gray-700 dark:text-zinc-300 text-sm sm:text-base leading-relaxed max-w-sm text-center md:text-left">
                    <RichText parts={about.paragraphs[1]} />
                </p>

                <Link
                    href="/login"
                    style={{ width: "170px" }}
                    prefetch={false}
                    className={styles.primaryCta}
                >
                    {about.cta}
                </Link>
            </div>

            <div className="hidden md:flex md:flex-1 md:items-center h-auto md:justify-center min-h-[auto] lg:min-h-[auto] px-4 lg:px-0 lg:me-10 xl:me-20">
                <Image
                    src="/SrOrbis2.png"
                    alt={about.imageAlt}
                    width={900}
                    height={900}
                    className="mt-7 object-contain w-full max-w-[300px] lg:max-w-[420px] xl:max-w-[540px]"
                />
            </div>
        </section>
    );
}
