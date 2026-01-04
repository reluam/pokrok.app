import IntroSection from '@/components/IntroSection'
import LatestInspiration from '@/components/LatestInspiration'
import BookingSection from '@/components/BookingSection'
import AppsSection from '@/components/AppsSection'
import InspirationSection from '@/components/InspirationSection'
import AboutSection from '@/components/AboutSection'

export default function Home() {
  return (
    <div className="min-h-screen">
      <IntroSection />
      <LatestInspiration />
      <BookingSection />
      <AppsSection />
      <InspirationSection />
      <AboutSection />
    </div>
  )
}
