"use client"

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
      github: "https://github.com/Kcaio28",
      instagram: "https://instagram.com/kcaioferrer",
      email: "carioferrer4@gmail.com",
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
      github: "https://github.com/gabriellourencetti",
      instagram: "https://instagram.com/_ruivoxy",
      email: "gglourencetti@gmail.com",
    },
    avatarClass: "from-[#5E17EB] to-violet-500",
  },
  {
    name: "Guilherme Orlof",
    role: "Desenvolvedor IoT e Frontend",
    image: "/guilherme.jpeg",
    initials: "GO",
    cardClass: "bg-[#5E17EB] dark:bg-[#5E17EB]",
    links: {
      linkedin: "https://linkedin.com/in/guilhermeOrlof",
      github: "https://github.com/guilhermeorlof",
      instagram: "https://instagram.com/guiorlof",
      email: "orlofguilherme@gmail.com",
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
      linkedin: "https://www.linkedin.com/in/gustavopereiracagega",
      github: "https://github.com/gpc186",
      instagram: "https://instagram.com/usuario",
      email: "gustavopereira010806@gmail.com",
    },
    avatarClass: "from-[#5E17EB] to-violet-500",
  },
  {
    name: "Henrique Fiorotti",
    role: "Desenvolvedor Frontend",
    initials: "HF",
    image: "/henrique (2).jpeg",
    cardClass: "bg-[#5E17EB] dark:bg-[#5E17EB]",
    links: {
      linkedin: "https://www.linkedin.com/in/henrique-berdoldi-fiorotti?utm_source=share_via&utm_content=profile&utm_medium=member_ios",
      github: "https://github.com/Henrique-Fiorotti",
      instagram: "https://instagram.com/whytezx",
      email: "hberdoldifiorotti@gmail.com",
    },
    avatarClass: "from-[#5E17EB] to-violet-500",
  },
  {
    name: "Murilo Almeida",
    role: "Desenvolvedor Mobile",
    image: "/murilo.jpeg",
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

function TeamMemberCard({ member }) {
  return (
    <article
      className={`group relative flex min-h-[224px] select-none flex-col items-center justify-end rounded-[30px] px-4 pb-6 pt-20 text-center shadow-[0_18px_40px_rgba(94,23,235,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(94,23,235,0.26)] ${member.cardClass}`}
    >
      <div className="pointer-events-none absolute -top-16 z-10 size-32 rounded-full border border-white/15" />
      <div className="pointer-events-none absolute -top-11 z-10 size-24 rounded-full border border-white/20" />

      <div className="select-none absolute -top-14 z-20 flex size-28 items-center justify-center rounded-full bg-background p-1.5 shadow-sm transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_18px_36px_rgba(24,24,27,0.18)]">
        {member.image ? (
          <img
            src={member.image}
            alt={member.name}
            draggable={false}
            className="select-none size-full rounded-full object-cover"
          />
        ) : (
          <div
            className={`select-none flex size-full items-center justify-center rounded-full bg-gradient-to-br text-2xl font-semibold text-white ${member.avatarClass}`}
          >
            {member.initials}
          </div>
        )}
      </div>

      <h3 className="select-none text-base font-semibold text-white">{member.name}</h3>
      <p className="select-none mt-2 text-sm text-zinc-200">{member.role}</p>

      <div className="mt-7 flex items-center justify-center gap-3">
        {SOCIAL_LINKS.map(({ key, icon: Icon, label }) => (
          <a
            key={key}
            href={
              key === "email"
                ? `mailto:${member.links?.[key]}`
                : member.links?.[key] || "#contact"
            }
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
  )
}

export default function CreativeTeamSection() {
  return (
    <section className="bg-transparent px-[8vw] py-20 text-[var(--landing-heading)] transition-colors max-[640px]:px-[6vw]">
      <div className="mx-auto max-w-[1100px]">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex rounded-full border border-[var(--landing-secondary-border)] bg-[var(--landing-feature-bg)] px-3 py-1 text-sm text-[var(--landing-heading)] shadow-sm">
            Equipe
          </span>
          <h2 className="mt-5 font-['Poppins',sans-serif] text-3xl font-semibold leading-tight tracking-normal text-[var(--landing-heading)] sm:text-4xl">
            Conheça as mentes por trás do Orbis
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-[var(--landing-muted)] sm:text-lg">
            {/* Uma equipe apaixonada por sistemas, animações, fluidez e experiências simples para transformar a sua operação em uma decisão inteligente. */}
            Sistemas fluidos e experiências simples: transformamos a sua operação em uma decisão inteligente.
          </p>
        </div>

        <div className="mb-20 mt-20 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM_MEMBERS.map((member) => (
            <TeamMemberCard key={member.name} member={member} />
          ))}
        </div>
      </div>
    </section>
  )
}
