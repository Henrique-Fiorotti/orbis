export default function notfound(){
    return(
        <>
            <div className="w-full h-svh bg-white flex justify-center items-center pt-20">
                <div className="flex flex-col justify-center items-center gap-y-5">
                    <img src="/hero_404.svg" alt="" className="mr-16" />
                    <h1 className="text-7xl! font-[poppins]! font-[100]! text-[#5e17eb]!">404</h1>
                    <div className="text-center text-[15px]/5!">
                        <h3 className="text-black text-[15px]/4! font-[poppins]! font-[100]! font-light!">Parece que você se perdeu</h3>
                        <h3 className="text-black text-[15px]/1! font-[poppins]! font-light!">Voltar para <a href="/" className="text-[#5e17eb]! underline!">Página inicial</a></h3>
                    </div>
                </div>
            </div>
        </>
    )
}