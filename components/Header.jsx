export default function Header(){
    return(
        <>
        <div className="main-header flex justify-between items-center pl-[15%] pr-[15%] w-[100%] h-16 bg-[#d9d9d9]">
            <a className="icon-header h-[100%] w-8">
                <img src="/Orbis.svg" alt="" className="h-[100%] w-[100%] cursor-[pointer]" />
            </a>
            <div className="actions-header flex gap-x-9.5 justify-center items-center text-[10pt]">
            <span className="text-black">Sobre</span>
            <span className="text-black">Contato</span>

            <a href="" className="border-2 border-fuchsia-600 text-fuchsia-600 p-2 w-[100px] flex justify-center rounded-2xl cursor-pointer">Login</a>
            </div>
        </div>
        </>
    )
}