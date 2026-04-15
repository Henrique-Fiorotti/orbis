import Header from '@/components/Header'
import { Poppins, Open_Sans } from 'next/font/google'
import Head from 'next/head'
import FooterPage from '../footer-01/page'
import Footer from '@/components/shadcn-space/blocks/footer-01/footer'
import HomeLoader from "@/components/Loader/HomeLoader"


const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-open-sans',
})

export default function RootLayout({ children }) {
  return (
    <div className={`${poppins.variable} ${openSans.variable}`}>
      <Header />
      <HomeLoader />
      {children}
      <HomeLoader />
      <Footer />
    </div>
  )
}
