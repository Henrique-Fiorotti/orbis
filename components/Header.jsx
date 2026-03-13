import React from "react";
import Image from "next/image";
import Bootstrap from "bootstrap/dist/css/bootstrap.min.css";
export default function Header() {
  return (
    <>
      <nav className="navbar navbar-expand-lg bg-body-tertiary  z-10 fixed! main-header flex justify-between items-center pl-[15%]! pr-[15%]! w-full h-16 bg-[#fffffff9] border-1 border-[#2222222a]">
        <div className="container-fluid">
          <a href="" className="navbar-brand icon-header h-full w-8">
            <img
              src="/Orbis.svg"
              alt=""
              className="h-[100%] w-[100%] cursor-[pointer]"
            />
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse width-auto-important" id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item">
                <a
                  href=""
                  className="nav-link relative! px-4! py-2! rounded-[8px]! inline-block! text-[#2e2e2e]! font-poppins! hover:bg-gray-200/90! hover:text-[#5e17eb]! transition-all! duration-150 ease-in-out!"
                  aria-current="page"
                >
                  Home
                </a>
              </li>
              <li className="nav-item">
                <a
                  href=""
                  className="nav-link relative! px-4! py-2! rounded-[8px]! inline-block! text-[#2e2e2e]! font-poppins! hover:bg-gray-200/90! hover:text-[#5e17eb]! transition-all! duration-150 ease-in-out!"
                >
                  Sobre
                </a>
              </li>
              <li className="nav-item">
                <a
                  href=""
                  className="nav-link relative! px-4! py-2! rounded-[8px]! inline-block! text-[#2e2e2e]! font-poppins! hover:bg-gray-200/90! hover:text-[#5e17eb]! transition-all! duration-150 ease-in-out!"
                  aria-current="page"
                >
                  Contato
                </a>
              </li>
              
              <li className="nav-item">
                <a
                  href=""
                  className="nav-link border-2 border-[#5e17eb]! text-[#5e17eb]! p-1.5! w-22.5! flex! justify-center! rounded-[10px]! cursor-pointer! font-poppins! hover:bg-[#5013ca]! hover:text-[#ffffff]! hover:border-[#5013ca]! transition-all! duration-150 ease-in-out!"
                >
                  Login
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    </>
  );
}
