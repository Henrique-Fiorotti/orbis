import { Geist, Geist_Mono, Poppins, Open_Sans } from "next/font/google"
import "./globals.css"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "next-themes"
import PageLoader from "@/components/Loader/PageLoader"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-open-sans",
})

export const metadata = {
  title: "Orbis - Soluções Preventivas",
  description:
    "A Orbis é uma empresa de tecnologia especializada em soluções preventivas para o futuro.",
}

export default function RootLayout({ children, modal }) {
  return (
    <html
      lang="pt-BR"
      className={`${poppins.variable} ${openSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/*<ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="orbis-theme"
          disableTransitionOnChange
        ></ThemeProvider> */}

        {/* O theme provider é necessário para o dark mode funcionar, mesmo que a aplicação não use o dark mode */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children} {/* Children é o conteúdo da página, ou seja, o que está dentro do layout*/}
          <PageLoader /> {/* PageLoader é um componente que exibe um loader enquanto a página está carregando */}
          {modal} {/* Conteudo do modal */}
        </ThemeProvider>
      </body>
    </html>
  )
}