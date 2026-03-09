

export default function Header(){
    return(
        <>
        <div className="fixed main-header flex justify-between items-center pl-[15%] pr-[15%] w-[100%] h-16 bg-[#ffffff] border-2 border-[#2222222a]">
            <a className="icon-header h-[100%] w-8">
                <img src="/Orbis.svg" alt="" className="h-[100%] w-[100%] cursor-[pointer]" />
            </a>
            <div className="actions-header flex gap-x-9.5 justify-center items-center text-[10pt]">
            <span className="text-[#2e2e2e] font-[var(--font-poppins)]">Sobre</span>
            <span className="text-[#2e2e2e]">Contato</span>

            <a href="" className="border-2 border-[#5e17eb] text-[#5e17eb] p-1.5 w-[100px] flex justify-center rounded-[10px] cursor-pointer">Login</a>
            </div>
        </div>
        </>
    )
}