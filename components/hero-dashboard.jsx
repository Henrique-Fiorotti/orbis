import Image from "next/image";
import Link from "next/link";

export default function HeroDashboard() {
    return (
        <>
            <div className="w-full flex justify-between pl-[15%] pr-[15%] py-12 gap-12">
                <div className="w-1/4 flex flex-col gap-6 justify-between">
                    <div>
                        <h1 className="font-poppins text-[33pt]/11! font-thin! ">Dashboard <br />
                            Preventivo</h1>
                        <p className="text-[15pt]/6 text-gray-400">Gestão geral das suas máquinas, sua empresa na sua mão</p>
                    </div>
                    <Link
                                  href="/login"
                                  style={{
                                    background: "#7b39ed",
                                    color: "#fff",
                                    padding: "13px 28px",
                                    borderRadius: "10px",
                                    fontWeight: 600,
                                    fontSize: "0.9rem",
                                    fontFamily: "'Poppins', sans-serif",
                                    textDecoration: "none",
                                    letterSpacing: "0.01em",
                                    textAlign: "center",
                                    transition:
                                      "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background-color 0.2s ease",
                                    boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
                                    display: "inline-block",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "white";
                                    e.currentTarget.style.color = "#7b39ed";
                                    e.currentTarget.style.border = " 2px solid #7b39ed";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "none";
                                    e.currentTarget.style.color = "#fff";
                                    e.currentTarget.style.backgroundColor = "#7b39ed";
                                    e.currentTarget.style.border = " 2px solid transparent";
                                  }}
                                >
                                  Comece agora
                                </Link>
                </div>
                <div>
                    <Image src="/orbis_dashboard_hero.svg" alt="Dashboard Preventivo" width={600} height={500} />
                </div>
                
            </div>
        </>
    )
}