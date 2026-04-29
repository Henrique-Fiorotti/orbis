'use client'
import Image from "next/image";
import ThemeAwareImage from "@/components/landing/theme-aware-image";
import Link from "next/link";

import styles from "../app/(public)/page.module.css";


export default function SobreInformativo() {
    return (
        <section
            style={{ background: "var(--landing-alt-bg)" }}
            className="flex flex-col md:flex-row min-h-max bg-[#f0f0f056] dark:bg-zinc-900 md:ms-0 lg:ms-16 xl:ms-90"
        >
            {/* Mobile: imagem decorativa no topo */}
            <div className="flex md:hidden w-full justify-center items-end h-[260px] sm:h-[300px] overflow-hidden">
                <Image
                    src="/SrOrbis2.png"
                    alt="Profissional Orbis"
                    width={900}
                    height={900}
                    className="object-contain object-bottom h-full w-auto"
                />
            </div>

            {/* Lado esquerdo - conteúdo */}
            <div className="w-full md:w-[460px] lg:w-[500px] md:flex-shrink-0 flex flex-col items-center md:items-start px-8 sm:px-12 md:px-10 lg:px-8 py-8 md:py-20 gap-6 md:gap-10">
                <div className="flex items-left gap-1">
                    <ThemeAwareImage
                        lightSrc="/Orbis_extended.svg"
                        darkSrc="/LogoBrancaGrandeV3.png"
                        alt="Logo Orbis"
                        width={280}
                        height={70}
                        className="w-[200px] sm:w-[240px] md:w-[280px] h-auto"
                    />
                </div>

                <p style={{ fontFamily: "'Poppins', sans-serif" }} className="text-gray-700 dark:text-zinc-300 text-sm sm:text-base leading-relaxed max-w-sm text-center md:text-left">
                    A <strong className="text-black dark:text-white">Orbis supervisiona continuamente</strong> o
                    funcionamento das <strong className="text-black dark:text-white">máquinas e equipamentos industriais</strong>,
                    identificando irregularidades antes que se tornem problemas maiores e garantindo mais{" "}
                    <strong className="text-black dark:text-white">segurança na operação</strong>.
                </p>

                <p style={{ fontFamily: "'Poppins', sans-serif" }} className="text-gray-700 dark:text-zinc-300 text-sm sm:text-base leading-relaxed max-w-sm text-center md:text-left">
                    Com <strong className="text-black dark:text-white">monitoramento constante</strong>, o sistema detecta
                    rapidamente qualquer alteração no desempenho dos equipamentos, permitindo que as medidas
                    necessárias sejam tomadas com <strong className="text-black dark:text-white">agilidade</strong> e{" "}
                    <strong className="text-black dark:text-white">evitando falhas na produção</strong>.
                </p>

                <Link
                    href="/login"
                    style={{ width: "170px" }}
                    prefetch={false}
                    className={styles.primaryCta}
                >
                    Acesse o Orbis
                </Link>
            </div>

            {/* Lado direito - imagem (tablet/desktop) */}
            <div className="hidden md:flex md:flex-1 md:items-center md:justify-center min-h-[480px] lg:min-h-[560px] px-4 lg:px-0 lg:me-10 xl:me-20">
                <Image
                    src="/SrOrbis2.png"
                    alt="Profissional Orbis"
                    width={900}
                    height={900}
                    className="object-contain w-full max-w-[300px] lg:max-w-[420px] xl:max-w-[540px]"
                />
            </div>
        </section>
    );
}