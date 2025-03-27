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
import AnimatedBackground from "@/components/common/animated-background";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to appropriate dashboard if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === "owner") {
        setLocation("/owner");
      } else if (user.role === "customer") {
        setLocation("/customer");
      }
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <AnimatedBackground />
      <Header />
      <main className="relative z-10">
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
