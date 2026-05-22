"use client"

import * as React from "react"
import {
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
  MailIcon,
} from "lucide-react"

const TEAM_MEMBERS = [
  {
    name: "Caio Ferrer",
    role: "Desenvolvedor Backend",
    image: "/caio.jpeg",
    initials: "CF",
    cardClass: "bg-[#5E17EB] dark:bg-[#5E17EB]",
    links: {
      linkedin: "https://linkedin.com/in/usuario",
      github: "https://github.com/usuario",
      instagram: "https://instagram.com/usuario",
      email: "mailto:email@exemplo.com",
    },
    avatarClass: "from-[#5E17EB] to-violet-500",
  },
  {
    name: "Gabriel Lourencetti",
    role: "Desenvolvedor Frontend",
    image: "/gabriel.jpeg",
    initials: "GL",
    cardClass: "bg-[#7C3AED] dark:bg-[#7C3AED]",
    links: {
      linkedin: "https://www.linkedin.com/in/gabriel-lourencetti-souza-04b525276",
      github: "https://github.com/usuario",
      instagram: "https://instagram.com/usuario",
      email: "mailto:email@exemplo.com",
    },
    avatarClass: "from-[#5E17EB] to-violet-500",
  },
  {
    name: "Guilherme Orlof",
    role: "Desenvolvedor IoT e Frontend",
    image: "/gui.jpeg",
    initials: "GO",
    cardClass: "bg-[#5E17EB] dark:bg-[#5E17EB]",
    links: {
      linkedin: "https://linkedin.com/in/usuario",
      github: "https://github.com/usuario",
      instagram: "https://instagram.com/usuario",
      email: "mailto:email@exemplo.com",
    },
    avatarClass: "from-[#5E17EB] to-violet-500",
  },
  {
    name: "Gustavo Cagega",
    role: "Desenvolvedor Backend",
    image: "/gustavo.jpeg",
    initials: "GC",
    cardClass: "bg-[#7C3AED] dark:bg-[#7C3AED]",
    links: {
      linkedin: "https://linkedin.com/in/usuario",
      github: "https://github.com/usuario",
      instagram: "https://instagram.com/usuario",
      email: "mailto:email@exemplo.com",
    },
    avatarClass: "from-[#5E17EB] to-violet-500",
  },
  {
    name: "Henrique Fiorotti",
    role: "Desenvolvedor Frontend",
    initials: "HF",
    image: "/henrique.jpeg",
    cardClass: "bg-[#5E17EB] dark:bg-[#5E17EB]",
    links: {
      linkedin: "https://linkedin.com/in/usuario",
      github: "https://github.com/usuario",
      instagram: "https://instagram.com/usuario",
      email: "mailto:email@exemplo.com",
    },
    avatarClass: "from-[#5E17EB] to-violet-500",
  },
  {
    name: "Murilo Almeida",
    role: "Desenvolvedor Mobile",
    initials: "MA",
    cardClass: "bg-[#7C3AED] dark:bg-[#7C3AED]",
    links: {
      linkedin: "https://linkedin.com/in/usuario",
      github: "https://github.com/usuario",
      instagram: "https://instagram.com/usuario",
      email: "mailto:email@exemplo.com",
    },
    avatarClass: "from-[#5E17EB] to-violet-500",
  },
]

const SOCIAL_LINKS = [
  { key: "linkedin", icon: LinkedinIcon, label: "LinkedIn" },
  { key: "github", icon: GithubIcon, label: "GitHub" },
  { key: "instagram", icon: InstagramIcon, label: "Instagram" },
  { key: "email", icon: MailIcon, label: "Email" },
]

export default function CreativeTeamSection() {
  return (
    <section className="bg-[var(--landing-section-bg)] px-6 py-20 text-[var(--landing-heading)] transition-colors sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex rounded-full border border-[var(--landing-secondary-border)] bg-[var(--landing-feature-bg)] px-3 py-1 text-sm text-[var(--landing-heading)] shadow-sm">
            Equipe criativa
          </span>
          <h2 className="mt-5 font-['Poppins',sans-serif] text-3xl font-semibold leading-tight tracking-normal text-[var(--landing-heading)] sm:text-4xl">
            Conheça as mentes por trás do Orbis
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-[var(--landing-muted)] sm:text-lg">
            Uma equipe apaixonada por inovação, dados e experiências simples para transformar manutenção em decisão inteligente.
          </p>
        </div>

        <div className="mt-20 mb-20 grid gap-x-4 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {TEAM_MEMBERS.map((member) => (
            <article
              key={member.name}
              className={`group relative flex min-h-[224px] select-none flex-col items-center justify-end rounded-[30px] px-4 pb-6 pt-20 text-center shadow-[0_18px_40px_rgba(94,23,235,0.18)] transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.025] hover:shadow-[0_28px_64px_rgba(94,23,235,0.32)] ${member.cardClass}`}
            >
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[30px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.35),transparent_42%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute -left-24 top-0 h-full w-16 skew-x-[-18deg] bg-white/25 blur-sm transition-transform duration-700 group-hover:translate-x-[420px]" />
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-[30px] ring-1 ring-white/0 transition duration-500 group-hover:ring-white/25" />

              <div className="select-none absolute -top-14 z-20 flex size-28 items-center justify-center rounded-full bg-background p-1.5 shadow-sm transition duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-[0_18px_36px_rgba(24,24,27,0.22)]">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    draggable={false}
                    className="select-none size-full rounded-full object-cover "
                  />
                ) : (
                  <div
                    className={`select-none flex size-full items-center justify-center rounded-full bg-gradient-to-br text-2xl font-semibold text-white transition duration-500 ease-out group-hover:scale-105 ${member.avatarClass}`}
                  >
                    {member.initials}
                  </div>
                )}
              </div>

              <div className="relative z-10 transition duration-500 ease-out group-hover:-translate-y-1">
                <h3 className="select-none text-base font-semibold text-white transition duration-500 group-hover:tracking-wide">{member.name}</h3>
                <p className="select-none mt-2 text-sm text-zinc-200 transition duration-500 group-hover:text-white/90">{member.role}</p>
              </div>

              <div className="relative z-10 mt-7 flex items-center justify-center gap-3 transition duration-500 ease-out group-hover:-translate-y-1">
                {SOCIAL_LINKS.map(({ key, icon: Icon, label }) => (
                  <a
                    key={key}
                    href={member.links?.[key] || "#contact"}
                    target={key === "email" ? undefined : "_blank"}
                    rel={key === "email" ? undefined : "noreferrer"}
                    aria-label={`${label} de ${member.name}`}
                    className="inline-flex size-7 items-center justify-center rounded-full text-white transition duration-300 hover:-translate-y-1 hover:scale-110 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-purple-400/35"
                  >
                    <Icon className="size-4" />
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
