import { Open_Sans, Poppins } from "next/font/google"
import { ThemeProvider } from "next-themes"

import PageLoader from "@/components/Loader/PageLoader"
import "./globals.css"

/** @typedef {import("@/lib/orbis-types").RootLayoutProps} RootLayoutProps */

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

/** @type {import("next").Metadata} */
export const metadata = {
  title: "Orbis - Soluções Preventivas",
  description:
    "A Orbis é uma empresa de tecnologia especializada em soluções preventivas para o futuro.",
}

/**
 * @param {RootLayoutProps} props
 */
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
