import Hero from '@/components/Hero'
import BookingSection from '@/components/BookingSection'
import AppsSection from '@/components/AppsSection'
import InspirationSection from '@/components/InspirationSection'
import AboutSection from '@/components/AboutSection'

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="pt-20">
        <Hero />
      </div>
      <BookingSection />
      <AppsSection />
      <InspirationSection />
      <AboutSection />
    </div>
  )
}
