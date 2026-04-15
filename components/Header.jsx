"use client";

import React from "react";
import Link from "next/link";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import "bootstrap/dist/css/bootstrap.min.css"
export default function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-body-tertiary z-10 fixed! main-header flex justify-between items-center pl-[15%]! pr-[15%]! w-full h-16 bg-[#fffffff9]! border border-[#2222222a] dark:bg-[#09090bf2]! dark:border-white/10!">
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
            <ul className="navbar-nav bg-gray-100! rounded-[10px]! border-3! border-gray-100! dark:bg-white/5! dark:border-white/5!">
              <li className="nav-item">
                <a
                  href="/"
                  className="nav-link relative! px-4! py-2! rounded-[8px]! inline-block! text-[#2e2e2e]/70! font-poppins! hover:bg-white! border! border-gray-100! hover:border! hover:border-gray-300! hover:text-[#5e17eb]! transition-all! duration-150 ease-in-out! dark:text-white/70! dark:border-white/5! dark:hover:bg-white/8! dark:hover:border-white/15!"
                  aria-current="page"
                >
                  Home
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="/#sobre"
                  className="nav-link relative! px-4! py-2! rounded-[8px]! inline-block! text-[#2e2e2e]/70! font-poppins! hover:bg-white! border! border-gray-100! hover:border! hover:border-gray-300! hover:text-[#5e17eb]! transition-all! duration-150 ease-in-out! dark:text-white/70! dark:border-white/5! dark:hover:bg-white/8! dark:hover:border-white/15!"
                >
                  Sobre
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="/contact"
                  className="nav-link relative! px-4! py-2! rounded-[8px]! inline-block! text-[#2e2e2e]/70! font-poppins! hover:bg-white! border! border-gray-100! hover:border! hover:border-gray-300! hover:text-[#5e17eb]! transition-all! duration-150 ease-in-out! dark:text-white/70! dark:border-white/5! dark:hover:bg-white/8! dark:hover:border-white/15!"
                  aria-current="page"
                >
                  Contato
                </a>
              </li>

              
            </ul>
          
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
              className="flex h-10! w-10! items-center justify-center rounded-[10px]! border! border-[#5e17eb]/20! text-[#5e17eb]! transition-all! duration-150 ease-in-out! hover:bg-[#5e17eb]! hover:text-white! dark:border-white/10! dark:text-white!"
            >
              {mounted ? (
                isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />
              ) : (
                <MoonIcon size={18} className="opacity-0" />
              )}
            </button>
            <li className="nav-item list-none! loginbutton">
              <Link
                href="/login"
                className="nav-link border! border-[#5e17eb]! text-[#5e17eb]! p-1.5! w-22.5! flex! justify-center! rounded-[10px]! cursor-pointer! font-poppins! hover:bg-[#5e17eb]! hover:text-[#ffffff]! hover:border-[#5e17eb]! transition-all! duration-150 ease-in-out!"
              >
                Login
              </Link>
            </li>
          </div>
        </div>
      </nav>

      <div className="offcanvas offcanvas-end dark:bg-[#09090b]! dark:text-white!" tabIndex="-1" id="offcanvasRight" aria-labelledby="offcanvasRightLabel">
            <div className="offcanvas-header pl-[15%]! pr-[15%]! h-16 bg-[#fffffff9]! border border-[#2222222a] dark:bg-[#09090bf2]! dark:border-white/10!">
              <img src="/Orbis.svg" alt="Orbis" className="h-full w-auto" />
              <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div className="offcanvas-body pl-[15%]! pr-[15%]! dark:bg-[#09090b]!">
              <a
                  href="/"
                  className="nav-link relative! px-4! py-2! rounded-[8px]! inline-block! text-[#2e2e2e]! font-poppins! hover:bg-gray-200/90! hover:text-[#5e17eb]! transition-all! duration-150 ease-in-out! text-[25px]! dark:text-white! dark:hover:bg-white/8!"
                  aria-current="page"
                >
                  Home
                </a>

                <a
                  href="/#sobre"
                  className="nav-link relative! px-4! py-2! rounded-[8px]! inline-block! text-[#2e2e2e]! font-poppins! hover:bg-gray-200/90! hover:text-[#5e17eb]! transition-all! duration-150 ease-in-out! text-[25px]! dark:text-white! dark:hover:bg-white/8!"
                >
                  Sobre
                </a>

                <a
                  href="/contact"
                  className="nav-link relative! px-4! py-2! rounded-[8px]! inline-block! text-[#2e2e2e]! font-poppins! hover:bg-gray-200/90! hover:text-[#5e17eb]! transition-all! duration-150 ease-in-out! text-[25px]! dark:text-white! dark:hover:bg-white/8!"
                  aria-current="page"
                >
                  Contato
                </a>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="mt-4! mb-4! flex h-12! w-12! items-center justify-center rounded-[10px]! border! border-[#5e17eb]/25! text-[#5e17eb]! transition-all! duration-150 ease-in-out! hover:bg-[#5e17eb]! hover:text-white! dark:border-white/10! dark:text-white!"
                >
                  {mounted ? (
                    isDark ? <SunIcon size={20} /> : <MoonIcon size={20} />
                  ) : (
                    <MoonIcon size={20} className="opacity-0" />
                  )}
                </button>

                <Link
                  href="/login"
                  className="nav-link border-2! border-[#5e17eb]! text-[#5e17eb]! p-1.5! w-22.5! flex! justify-center! rounded-[10px]! cursor-pointer! font-poppins! hover:bg-[#5013ca]! hover:text-[#ffffff]! hover:border-[#5013ca]! transition-all! duration-150 ease-in-out text-[25px]!"
                >
                  Login
                </Link>
            </div>
          </div>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    </>
  );
}
