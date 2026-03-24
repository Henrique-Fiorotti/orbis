import Logo from "@/assets/logo/logo";
import { Separator } from "@/components/ui/separator";
import { Twitter, Linkedin, Instagram, Dribbble, Github } from "lucide-react";

const footerSections = [
  {
    title: "Sitemap",
    links: [
      {
        title: "Contact us",
        href: "#",
      },
      {
        title: "About us",
        href: "#",
      },
      {
        title: "Work",
        href: "#",
      },
      {
        title: "Services",
        href: "#",
      },
      {
        title: "Pricing",
        href: "#",
      },
    ],
  },
  {
    title: "Other Pages",
    links: [
      {
        title: "Error 404",
        href: "#",
      },
      {
        title: "Terms & Conditions",
        href: "#",
      },
      {
        title: "Privacy Policy",
        href: "#",
      },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="py-10">
      <div className="max-w-7xl xl:px-16 lg:px-8 px-4 mx-auto">
        <div className="flex flex-col gap-6 sm:gap-12">
          <div
            className="py-12 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-12 gap-x-8 gap-y-10 px-6 xl:px-0">
            <div className="col-span-full lg:col-span-4">
              <div
                className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
                {/* Logo */}
                <a href="#">
                  <Logo />
                </a>

                <p className="text-base font-normal text-muted-foreground">
                  Empowering businesses with innovative solutions. Let's create
                  something amazing together.
                </p>

                {/* social links */}
                <div className="flex items-center gap-4">
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    <Github color="#5e17eb" size={25} />
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    <Twitter color="#5e17eb" size={25} />
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    <Linkedin color="#5e17eb" size={25} />
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    <Instagram color="#5e17eb" size={25} />
                  </a>
                </div>
              </div>
            </div>

            <div className="col-span-1 lg:block hidden"></div>

            {footerSections.map(({ title, links }, index) => (
              <div key={index} className="col-span-2">
                <div
                  className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
                  <p className="text-base font-medium text-foreground">
                    {title}
                  </p>
                  <ul className="flex flex-col gap-3 pl-0!">
                    {links.map(({ title, href }) => (
                      <li key={title}>
                        <a
                          href={href}
                          className="text-[#6b7280]! hover:text-[#5e17eb]! no-underline! text-base font-normal">
                          {title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            <div className="col-span-3">
              <div
                className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
                <p className="text-base font-medium text-foreground">
                  Contact Details
                </p>
                <ul className="flex flex-col gap-3">
                  <li>
                    <p className="text-[#6b7280]! hover:text-[#5e17eb]! text-base font-normal">
                      81 Rivington Street London EC2A 3AY
                    </p>
                  </li>
                  <li>
                    <a
                      href="mailto:contact@example.com"
                      className="text-[#6b7280]! hover:text-[#5e17eb]! no-underline! text-base font-normal">
                      orbis@orbis.com
                    </a>
                  </li>
                  <li>
                    <a
                      href="tel:+01051923556"
                      className="text-[#6b7280]! hover:text-[#5e17eb]! no-underline! text-base font-normal">
                      0105 192 3556
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <Separator orientation="horizontal" />
          <p
            className="text-sm font-normal text-muted-foreground text-center animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
            ©2026 Orbis. All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
