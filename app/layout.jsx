import { Geist, Geist_Mono } from "next/font/google";
import { Poppins, Open_Sans } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";
import FooterPage from "./footer-01/page";
import { TooltipProvider } from "@/components/ui/tooltip";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-open-sans",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Orbis - Soluções Preventivas",
  description:
    "A Orbis é uma empresa de tecnologia especializada em soluções preventivas para o futuro. Com foco em inovação e sustentabilidade, oferecemos serviços e produtos que ajudam nossos clientes a antecipar desafios e aproveitar oportunidades em um mundo em constante evolução.",
};

export default function RootLayout({ children, modal }) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} ${openSans.variable}`}>
      <body>
          {children}
          {modal}
      </body>
    </html>
  );
}
