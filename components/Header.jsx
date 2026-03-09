

export default function Header(){
    return(
        <>
        <div className="fixed main-header flex justify-between items-center pl-[15%] pr-[15%] w-full h-16 bg-[#ffffff] border-2 border-[#2222222a]">
            <a href="" className="icon-header h-full w-8" >
                <img src="/Orbis.svg" alt="" className="h-[100%] w-[100%] cursor-[pointer]" />
            </a>
            <div className="actions-header flex gap-x-9.5 justify-center items-center text-[10pt]">
            <a href="" className="relative inline-block text-[#2e2e2e] font-poppins hover:text-[#5e17eb] hover:-top-0.5 transition-all duration-150 ease-in-out">Sobre</a>
            <a href="" className="relative inline-block text-[#2e2e2e] font-poppins hover:text-[#5e17eb] hover:-top-0.5 transition-all duration-150 ease-in-out">Contato</a>

            <a href="" className="border-2 border-[#5e17eb] text-[#5e17eb] p-1.5 w-22.5 flex justify-center rounded-[10px] cursor-pointer font-poppins hover:bg-[#5013ca] hover:text-[#ffffff] hover:border-[#5013ca] transition-all duration-150 ease-in-out">Login</a>
            </div>
        </div>
        </>
    )
}