export default function notfound(){
    return(
        <>
            <div className="w-full h-svh bg-white flex justify-center items-center">
                <div className="flex flex-col justify-center items-center gap-y-5">
                    <img src="/hero_404.svg" alt="" className="mr-16" />
                    <h1 className="text-6xl text-[#5e17eb] font-light font-[family:var(--font-poppins)]">404</h1>
                    <div className="text-center">
                        <h3 className="text-black">Parece que você se perdeu</h3>
                        <h3 className="text-black">Voltar para <a href="/" className="text-[#5e17eb] underline">Página inicial</a></h3>
                    </div>
                </div>
            </div>
        </>
    )
}