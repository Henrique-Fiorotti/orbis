import Header from '@/components/Header'
import Footer from '@/components/shadcn-space/blocks/footer-01/footer'

export default function ContactLayout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}