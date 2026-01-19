import HeroSection from '@/components/HeroSection'
import AboutMeSection from '@/components/AboutMeSection'
import ValuesSection from '@/components/ValuesSection'
import ServicesSection from '@/components/ServicesSection'
import NewsletterSection from '@/components/NewsletterSection'
import LatestFromLibrary from '@/components/LatestFromLibrary'

export default function Home() {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <ValuesSection />
      <AboutMeSection />
      <LatestFromLibrary />
      <NewsletterSection />
    </>
  )
}
