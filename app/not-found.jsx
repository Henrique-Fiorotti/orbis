"use client"

import { useRouter } from "next/navigation";

export default function NotFound() {
    const router = useRouter();

    const handleBack = () => {
        if (document.referrer && document.referrer !== window.location.href) {
            router.back();
            
            // fallback caso trave
            setTimeout(() => {
                router.push("/");
            }, 1500);
        } else {
            router.push("/");
        }
    };

    return (
        <>

            <div
                style={{ background: "var(--landing-quote-bg)" }}
                className="w-full h-svh flex justify-center items-center pt-20"
            >
                <div className="flex flex-col justify-center items-center gap-y-5">
                    <img src="/hero_404.svg" alt="404" className="mr-16" />

                    <h1 className="text-7xl font-[poppins] font-[100] text-[#5e17eb]">
                        404
                    </h1>

                    <div className="text-center text-[15px]/5">
                        <h3
                            style={{ color: "var(--landing-accent-label)" }}
                            className="text-[15px]/4 font-[poppins] font-light"
                        >
                            Parece que você se perdeu
                        </h3>

                        <h3
                            style={{ color: "var(--landing-accent-label)" }}
                            className="text-[15px]/1 font-[poppins] font-light mt-2"
                        >
                            Voltar para:{" "}
                            <button
                                onClick={handleBack}
                                className="text-[#5e17eb] underline cursor-pointer"
                            >
                                Página anterior
                            </button>
                        </h3>
                    </div>
                </div>
            </div>
     
        </>
    );
}