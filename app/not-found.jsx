export default function notfound(){
    return(
        <>
            <div className="w-full h-svh bg-white flex justify-center items-center">
                <div className="flex flex-col justify-center items-center gap-y-5">
                    <img src="/hero_404.svg" alt="" className="mr-16" />
                    <h1 style={{fontFamily: "'Poppins', sans-serif", fontSize: "3.5rem", color: "#5e17eb"}} className="text-7xl">404</h1>
                    <div className="text-center">
                        <h3 className="text-black text-[15px]!">Parece que você se perdeu</h3>
                        <h3 className="text-black text-[15px]!">Voltar para <a href="/" className="text-[#5e17eb]! underline!">Página inicial</a></h3>
                    </div>
                </div>
            </div>
        </>
    )
}