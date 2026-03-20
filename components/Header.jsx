import React from "react";
import Image from "next/image";
import Bootstrap from "bootstrap/dist/css/bootstrap.min.css";
export default function Header() {
  return (
    <>
      <nav className="navbar navbar-expand-lg bg-body-tertiary  z-10 fixed! main-header flex justify-between items-center pl-[15%]! pr-[15%]! w-full h-16 bg-[#fffffff9]! border border-[#2222222a]">
        <div className="container-fluid">
          <div className="w-22.5! h-8!">
            <a href="/" className="navbar-brand icon-header h-full w-5!">
              <img
                src="/Orbis.svg"
                alt=""
                className="h-full! w-full! cursor-pointer"
              />
            </a>
          </div>
          <button
            className="navbar-toggler"
            type="button"
            aria-expanded="false"
            aria-label="Toggle navigation"
            data-bs-toggle="offcanvas"
            data-bs-target="#offcanvasRight"
            aria-controls="offcanvasRight"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse width-auto-important" id="navbarNav">
            <ul className="navbar-nav bg-gray-100! rounded-[10px]! border-3! border-gray-100!">
              <li className="nav-item">
                <a
                  href="/"
                  className="nav-link relative! px-4! py-2! rounded-[8px]! inline-block! text-[#2e2e2e]/70! font-poppins! hover:bg-white! border! border-gray-100! hover:border! hover:border-gray-300! hover:text-[#5e17eb]! transition-all! duration-150 ease-in-out!"
                  aria-current="page"
                >
                  Home
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="/#sobre"
                  className="nav-link relative! px-4! py-2! rounded-[8px]! inline-block! text-[#2e2e2e]/70! font-poppins! hover:bg-white! border! border-gray-100! hover:border! hover:border-gray-300! hover:text-[#5e17eb]! transition-all! duration-150 ease-in-out!"
                >
                  Sobre
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="/contact"
                  className="nav-link relative! px-4! py-2! rounded-[8px]! inline-block! text-[#2e2e2e]/70! font-poppins! hover:bg-white! border! border-gray-100! hover:border! hover:border-gray-300! hover:text-[#5e17eb]! transition-all! duration-150 ease-in-out!"
                  aria-current="page"
                >
                  Contato
                </a>
              </li>

              
            </ul>
          
          </div>
          <li className="nav-item list-none!">
                <a
                  href=""
                  className="nav-link border-2! border-[#5e17eb]! text-[#5e17eb]! p-1.5! w-22.5! flex! justify-center! rounded-[10px]! cursor-pointer! font-poppins! hover:bg-[#5013ca]! hover:text-[#ffffff]! hover:border-[#5013ca]! transition-all! duration-150 ease-in-out!"
                >
                  Login
                </a>
              </li>
        </div>
      </nav>

      <div className="offcanvas offcanvas-end" tabIndex="-1" id="offcanvasRight" aria-labelledby="offcanvasRightLabel">
            <div className="offcanvas-header pl-[15%]! pr-[15%]! h-16 bg-[#fffffff9]! border border-[#2222222a]">
              <img src="/Orbis.svg" alt="Orbis" className="h-full w-auto" />
              <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div className="offcanvas-body pl-[15%]! pr-[15%]!">
              <a
                  href="/"
                  className="nav-link relative! px-4! py-2! rounded-[8px]! inline-block! text-[#2e2e2e]! font-poppins! hover:bg-gray-200/90! hover:text-[#5e17eb]! transition-all! duration-150 ease-in-out! text-[25px]!"
                  aria-current="page"
                >
                  Home
                </a>

                <a
                  href="/#sobre"
                  className="nav-link relative! px-4! py-2! rounded-[8px]! inline-block! text-[#2e2e2e]! font-poppins! hover:bg-gray-200/90! hover:text-[#5e17eb]! transition-all! duration-150 ease-in-out! text-[25px]!"
                >
                  Sobre
                </a>

                <a
                  href="/contact"
                  className="nav-link relative! px-4! py-2! rounded-[8px]! inline-block! text-[#2e2e2e]! font-poppins! hover:bg-gray-200/90! hover:text-[#5e17eb]! transition-all! duration-150 ease-in-out! text-[25px]!"
                  aria-current="page"
                >
                  Contato
                </a>

                <a
                  href=""
                  className="nav-link border-2! border-[#5e17eb]! text-[#5e17eb]! p-1.5! w-22.5! flex! justify-center! rounded-[10px]! cursor-pointer! font-poppins! hover:bg-[#5013ca]! hover:text-[#ffffff]! hover:border-[#5013ca]! transition-all! duration-150 ease-in-out text-[25px]!"
                >
                  Login
                </a>
            </div>
          </div>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    </>
  );
}
