

export default function Header(){
    return(
        <>
        <div className="fixed main-header flex justify-between items-center pl-[15%] pr-[15%] w-[100%] h-16 bg-[#ffffff] border-2 border-[#2222222a]">
            <a href="" className="icon-header h-[100%] w-8" >
                <img src="/Orbis.svg" alt="" className="h-[100%] w-[100%] cursor-[pointer]" />
            </a>
            <div className="actions-header flex gap-x-9.5 justify-center items-center text-[10pt]">
            <a href="" className="text-[#2e2e2e] font-(--font-poppins) hover:text-[#5e17eb]">Sobre</a>
            <a href="" className="text-[#2e2e2e] font-(--font-poppins) hover:text-[#5e17eb]">Contato</a>

            <a href="" className="border-2 border-[#5e17eb] text-[#5e17eb] p-1.5 w-[90px] flex justify-center rounded-[10px] cursor-pointer font-(--font-poppins) hover:bg-[#5e17eb2a]   hover:transition-colors">Login</a>
            </div>
        </div>
        </>
    )
}