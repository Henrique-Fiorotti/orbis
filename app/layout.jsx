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
  title: "Orbis - Soluções Preventivas para o Futuro",
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <PageLoader />
          {modal}
        </ThemeProvider>
      </body>
    </html>
  )
}