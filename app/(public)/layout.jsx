import Header from '@/components/Header'
import { Poppins, Open_Sans } from 'next/font/google'
import Footer from '@/components/shadcn-space/blocks/footer-01/footer'
import HomeLoader from "@/components/Loader/HomeLoader"
import SmoothScroll from '@/components/SmootScroll'


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
      <SmoothScroll>
        <main>{children}</main>
      </SmoothScroll>
      <Footer />
    </div>
  )
}
