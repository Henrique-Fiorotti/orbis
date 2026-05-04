"use client";

import Logo from "@/assets/logo/logo";
import { useLandingLanguage } from "@/components/landing/language-provider";
import { Separator } from "@/components/ui/separator";
import { Twitter, Linkedin, Instagram, Github } from "lucide-react";

const Footer = () => {
  const { copy } = useLandingLanguage();
  const footer = copy.footer;

  return (
    <footer className="py-10 border-t border-gray-200 dark:bg-[#09090b] dark:border-gray-700">
      <div className="max-w-7xl xl:px-16 lg:px-8 px-4 mx-auto">
        <div className="flex flex-col gap-6 sm:gap-12">
          <div className="py-12 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-12 gap-x-8 gap-y-10 px-6 xl:px-0">
            <div className="col-span-full lg:col-span-4">
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
                <a href="/" aria-label={footer.logoAria}>
                  <Logo />
                </a>

                <p className="text-base font-normal text-muted-foreground leading-relaxed max-w-xs">
                  {footer.brandText}
                </p>

                <div className="flex items-center gap-4">
                  <a href="#" aria-label="GitHub" className="text-muted-foreground hover:text-[#5e17eb] transition-colors duration-150">
                    <Github color="#5e17eb" size={22} />
                  </a>
                  <a href="#" aria-label="Twitter / X" className="text-muted-foreground hover:text-[#5e17eb] transition-colors duration-150">
                    <Twitter color="#5e17eb" size={22} />
                  </a>
                  <a href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-[#5e17eb] transition-colors duration-150">
                    <Linkedin color="#5e17eb" size={22} />
                  </a>
                  <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-[#5e17eb] transition-colors duration-150">
                    <Instagram color="#5e17eb" size={22} />
                  </a>
                </div>
              </div>
            </div>

            <div className="col-span-1 lg:block hidden" />

            {footer.sections.map(({ title, links }) => (
              <div key={title} className="col-span-2">
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
                  <p className="text-base font-semibold text-foreground">
                    {title}
                  </p>
                  <ul className="flex flex-col gap-3 pl-0!">
                    {links.map(({ title: linkTitle, href }) => (
                      <li key={linkTitle}>
                        <a
                          href={href}
                          className="text-[#6b7280]! dark:text-[#9ca3af]! hover:text-[#5e17eb]! dark:hover:text-[#b794ff]! no-underline! text-sm font-normal transition-colors duration-150">
                          {linkTitle}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <Separator orientation="horizontal" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2">
            <p className="text-sm w-full! text-center font-normal text-muted-foreground animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both mb-0">
              {footer.copyright}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
