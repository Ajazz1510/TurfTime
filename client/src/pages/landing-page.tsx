import Header from "@/components/landing/header";
import Hero from "@/components/landing/hero";
import Features from "@/components/landing/features";
import HowItWorks from "@/components/landing/how-it-works";
import Pricing from "@/components/landing/pricing";
import Waitlist from "@/components/landing/waitlist";
import Testimonials from "@/components/landing/testimonials";
import FAQ from "@/components/landing/faq";
import Footer from "@/components/landing/footer";
import NearbyTurfs from "@/components/landing/nearby-turfs";
import { useAuth } from "@/hooks/use-auth";

export default function LandingPage() {
  const { user } = useAuth();
  
  // No redirect here - this version of the homepage is accessible to logged-in users

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main>
        <Hero />
        <Features />
        <NearbyTurfs />
        <HowItWorks />
        <Pricing />
        <Waitlist />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}