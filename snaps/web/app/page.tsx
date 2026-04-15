import { TopNav } from '@web/components/landing/TopNav';
import { Hero } from '@web/components/landing/Hero';
import { HowItWorks } from '@web/components/landing/HowItWorks';
import { ModelShowcase } from '@web/components/landing/ModelShowcase';
import { AppStoreCTA } from '@web/components/landing/AppStoreCTA';
import { Footer } from '@web/components/landing/Footer';
import { AuthRedirect } from '@web/components/AuthRedirect';

export default function LandingPage() {
  return (
    <>
      <AuthRedirect />
      <TopNav />
      <main>
        <Hero />
        <HowItWorks />
        <ModelShowcase />
        <AppStoreCTA />
      </main>
      <Footer />
    </>
  );
}
