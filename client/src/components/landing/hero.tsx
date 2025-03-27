import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, GanttChart, Footprints, Dumbbell } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative bg-black text-white overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-green-950 opacity-90"></div>
      
      {/* Grain texture overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iLjA1Ii8+PC9zdmc+')] opacity-20"></div>
      
      {/* Animated elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Football */}
        <div className="absolute w-12 h-12 rounded-full border-2 border-green-500/30 animate-float opacity-30"
          style={{ top: '15%', left: '10%', animationDelay: '0s' }}></div>
        
        {/* Cricket ball */}
        <div className="absolute w-8 h-8 rounded-full bg-green-500/20 animate-float-slow opacity-20"
          style={{ top: '45%', right: '15%', animationDelay: '1.5s' }}></div>
          
        {/* Badminton shuttlecock */}
        <div className="absolute w-6 h-6 transform rotate-45 border-t-2 border-l-2 border-green-400/20 animate-pulse-slow opacity-30"
          style={{ bottom: '25%', left: '25%', animationDelay: '2s' }}></div>
          
        {/* Field lines */}
        <div className="absolute h-px w-40 bg-gradient-to-r from-transparent via-green-500/30 to-transparent animate-pulse-slow" 
          style={{ top: '30%', right: '10%', animationDelay: '0.7s' }}></div>
        <div className="absolute h-px w-20 bg-gradient-to-r from-transparent via-green-500/20 to-transparent animate-pulse-slow" 
          style={{ bottom: '40%', left: '5%', animationDelay: '1.2s' }}></div>
          
        {/* Court boundary */}
        <div className="absolute w-40 h-40 border border-green-600/10 rounded-lg animate-spin-slow opacity-20"
          style={{ top: '10%', right: '20%', animationDelay: '3s' }}></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
              <div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 lg:px-0 lg:text-left lg:flex lg:items-center">
                <div className="lg:py-24">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-900/30 text-green-400 text-sm font-semibold mb-6">
                    <span className="mr-2">⚽️</span> Book your turf now
                  </div>
                  
                  <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-6xl xl:text-7xl text-shadow">
                    <span className="block pb-2">Book Your</span>
                    <span className="block">
                      <span className="text-primary text-shadow-green">Turf</span>
                      <span>time</span>
                    </span>
                  </h1>
                  
                  <p className="mt-6 text-xl text-gray-300 max-w-2xl">
                    Book premium sports turfs for cricket, football, and badminton with real-time availability and instant confirmation.
                  </p>
                  
                  <div className="flex flex-wrap gap-4 mt-8">
                    <Button asChild size="lg" className="px-6 font-semibold">
                      <Link to="/auth">Book Now</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="px-6 font-semibold">
                      <a href="#explore">
                        Explore Sports <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  
                  <div className="mt-10 flex items-center gap-8">
                    <div className="flex items-center">
                      <GanttChart className="h-6 w-6 text-primary mr-2" />
                      <span className="text-gray-300">Cricket</span>
                    </div>
                    <div className="flex items-center">
                      <Footprints className="h-6 w-6 text-primary mr-2" />
                      <span className="text-gray-300">Football</span>
                    </div>
                    <div className="flex items-center">
                      <Dumbbell className="h-6 w-6 text-primary mr-2" />
                      <span className="text-gray-300">Badminton</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 lg:mt-0 lg:relative">
                <div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 lg:max-w-none lg:px-0">
                  {/* Hero image with green gradient overlay */}
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-green-900/20">
                    <div className="absolute inset-0 bg-gradient-to-tr from-green-900/80 via-transparent to-transparent z-10"></div>
                    <img
                      className="w-full rounded-2xl"
                      src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1200&auto=format"
                      alt="Football turf field at night"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
