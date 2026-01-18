import HeroSection from '@/components/HeroSection'
import AboutMeSection from '@/components/AboutMeSection'
import ValuesSection from '@/components/ValuesSection'
import ServicesSection from '@/components/ServicesSection'
import LatestFromLab from '@/components/LatestFromLab'
import NewsletterSection from '@/components/NewsletterSection'

export default function Home() {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <ValuesSection />
      <LatestFromLab />
      <AboutMeSection />
      <NewsletterSection />
    </>
  )
}
