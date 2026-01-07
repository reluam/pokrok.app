import IntroSection from '@/components/IntroSection'
import LatestInspiration from '@/components/LatestInspiration'
import AppsSection from '@/components/AppsSection'
import InspirationSection from '@/components/InspirationSection'
import AboutSection from '@/components/AboutSection'

export default function Home() {
  return (
    <div className="min-h-screen">
      <IntroSection />
      <LatestInspiration />
      <AppsSection />
      <InspirationSection />
      <AboutSection />
    </div>
  )
}
