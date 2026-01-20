import HeroSection from '@/components/HeroSection'
import AboutAuthorSection from '@/components/AboutAuthorSection'
import ThreeSituationsSection from '@/components/ThreeSituationsSection'
import HowIWorkSection from '@/components/HowIWorkSection'
import LatestFromLibrary from '@/components/LatestFromLibrary'
import CTASection from '@/components/CTASection'

export default function Home() {
  return (
    <>
      <HeroSection />
      <AboutAuthorSection />
      <ThreeSituationsSection />
      <HowIWorkSection />
      <LatestFromLibrary />
      <CTASection />
    </>
  )
}
