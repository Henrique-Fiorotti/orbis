'use client'
import Image from "next/image";
import ThemeAwareImage from "@/components/landing/theme-aware-image";
import Link from "next/link";

import styles from "../app/(public)/page.module.css";


export default function SobreInformativo() {
    return (
        <section style={{background: "var(--landing-alt-bg)"}} className="flex min-h-max bg-[#f0f0f056] dark:bg-zinc-900">
            {/* Lado esquerdo - conteúdo */}
            <div className="w-500 flex flex-col justify-center pl-97 px-16 py-20 gap-10">

                {/* Logo */}
                <div className="flex items-center gap-1">
                    <ThemeAwareImage
                        lightSrc="/Orbis_extended.svg"
                        darkSrc="/LogoBrancaGrandeV3.png"
                        alt="Logo Orbis"
                        width={280}
                        height={70}
                    />
                </div>

                {/* Parágrafo 1 */}
                <p className="text-gray-700 dark:text-zinc-300 text-base leading-relaxed max-w-sm">
                    A <strong className="text-black dark:text-white">Orbis supervisiona continuamente</strong> o
                    funcionamento das <strong className="text-black dark:text-white">máquinas e equipamentos industriais</strong>,
                    identificando irregularidades antes que se tornem problemas maiores e garantindo mais{" "}
                    <strong className="text-black dark:text-white">segurança na operação</strong>.
                </p>

                {/* Parágrafo 2 */}
                <p className="text-gray-700 dark:text-zinc-300 text-base leading-relaxed max-w-sm">
                    Com <strong className="text-black dark:text-white">monitoramento constante</strong>, o sistema detecta
                    rapidamente qualquer alteração no desempenho dos equipamentos, permitindo que as medidas
                    necessárias sejam tomadas com <strong className="text-black dark:text-white">agilidade</strong> e{" "}
                    <strong className="text-black dark:text-white">evitando falhas na produção</strong>.
                </p>

                {/* Botão */}
                <Link href="/login" style={{width: "170px"}} prefetch={false} className={styles.primaryCta}>
                    Acesse o Orbis
                </Link>
            </div>

            {/* Lado direito - imagem */}
            <div className="w-full flex items-right justify-end overflow-hidden me-70">
                <Image
                    src="/SrOrbis2.png"
                    alt="Profissional Orbis"
                    width={900}
                    height={900}
                    className="object-contain h-full w-auto"
                />
            </div>
        </section>
    );
}