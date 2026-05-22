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
    role: "Backend Developer",
    image: "/caio.jpeg",
    initials: "CF",
    cardClass: "bg-sky-100/80 dark:bg-sky-950/30",
    links: {
      linkedin: "https://linkedin.com/in/usuario",
      github: "https://github.com/usuario",
      instagram: "https://instagram.com/usuario",
      email: "mailto:email@exemplo.com",
    },
    avatarClass: "from-sky-300 to-blue-500",
  },
  {
    name: "Gabriel Lourencetti",
    role: "Frontend Developer",
    image: "/gabriel.jpeg",
    initials: "GL",
    cardClass: "bg-zinc-200/80 dark:bg-zinc-800/70",
    links: {
      linkedin: "https://www.linkedin.com/in/gabriel-lourencetti-souza-04b525276",
      github: "https://github.com/usuario",
      instagram: "https://instagram.com/usuario",
      email: "mailto:email@exemplo.com",
    },
    avatarClass: "from-zinc-400 to-zinc-700",
  },
  {
    name: "Guilherme Orlof",
    role: "IOT and Frontend Developer",
    image: "/gui.jpeg",
    initials: "GO",
    cardClass: "bg-emerald-100/80 dark:bg-emerald-950/30",
    links: {
      linkedin: "https://linkedin.com/in/usuario",
      github: "https://github.com/usuario",
      instagram: "https://instagram.com/usuario",
      email: "mailto:email@exemplo.com",
    },
    avatarClass: "from-emerald-300 to-teal-500",
  },
  {
    name: "Gustavo Cagega",
    role: "Backend Developer",
    image: "/gustavo.jpeg",
    initials: "GC",
    cardClass: "bg-rose-100/80 dark:bg-rose-950/30",
    links: {
      linkedin: "https://linkedin.com/in/usuario",
      github: "https://github.com/usuario",
      instagram: "https://instagram.com/usuario",
      email: "mailto:email@exemplo.com",
    },
    avatarClass: "from-rose-300 to-pink-500",
  },
  {
    name: "Henrique Fiorotti",
    role: "Frontend Developer",
    initials: "HF",
    image: "/henrique.jpeg",
    cardClass: "bg-orange-100/80 dark:bg-orange-950/30",
    links: {
      linkedin: "https://linkedin.com/in/usuario",
      github: "https://github.com/usuario",
      instagram: "https://instagram.com/usuario",
      email: "mailto:email@exemplo.com",
    },
    avatarClass: "from-orange-300 to-amber-500",
  },
  {
    name: "Murilo Almeida",
    role: "Mobile Developer",
    initials: "MA",
    cardClass: "bg-orange-100/80 dark:bg-orange-950/30",
    links: {
      linkedin: "https://linkedin.com/in/usuario",
      github: "https://github.com/usuario",
      instagram: "https://instagram.com/usuario",
      email: "mailto:email@exemplo.com",
    },
    avatarClass: "from-orange-300 to-amber-500",
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
    <section className="bg-transparent px-6 py-20 text-[var(--landing-heading)] transition-colors sm:px-8 lg:px-12">
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

        <div className="mt-16 grid gap-x-4 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {TEAM_MEMBERS.map((member) => (
            <article
              key={member.name}
              className={`relative flex min-h-[224px] flex-col items-center justify-end rounded-[8px] px-4 pb-6 pt-20 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${member.cardClass}`}
            >
              <div className="absolute -top-14 flex size-28 items-center justify-center rounded-full bg-background p-1.5 shadow-sm">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    className="size-full rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`flex size-full items-center justify-center rounded-full bg-gradient-to-br text-2xl font-semibold text-white ${member.avatarClass}`}
                  >
                    {member.initials}
                  </div>
                )}
              </div>

              <h3 className="text-base font-semibold text-black dark:text-white">{member.name}</h3>
              <p className="mt-2 text-sm text-[var(--landing-muted)]">{member.role}</p>

              <div className="mt-7 flex items-center justify-center gap-3">
                {SOCIAL_LINKS.map(({ key, icon: Icon, label }) => (
                  <a
                    key={key}
                    href={member.links?.[key] || "#contact"}
                    target={key === "email" ? undefined : "_blank"}
                    rel={key === "email" ? undefined : "noreferrer"}
                    aria-label={`${label} de ${member.name}`}
                    className="inline-flex size-7 items-center justify-center rounded-full text-black transition hover:-translate-y-0.5 hover:text-[var(--landing-accent-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-purple-400/35 dark:text-white"
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
