import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, GanttChart, Footprints, Dumbbell } from "lucide-react";
import AnimatedSportsIcons from "./animated-sports-icons";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative bg-black text-white overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-green-950 opacity-90"></div>
      
      {/* Grain texture overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iLjA1Ii8+PC9zdmc+')] opacity-20"></div>
      
      {/* Animated sports icons */}
      <AnimatedSportsIcons />
      
      {/* Field lines with framer motion */}
      <motion.div 
        className="absolute h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent"
        style={{ top: '30%', right: '10%', width: 160 }}
        animate={{
          opacity: [0.1, 0.3, 0.1],
          width: [130, 160, 130]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />
      
      <motion.div 
        className="absolute h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent"
        style={{ bottom: '40%', left: '5%', width: 80 }}
        animate={{
          opacity: [0.1, 0.2, 0.1],
          width: [60, 80, 60]
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      
      {/* Court boundary with framer motion */}
      <motion.div 
        className="absolute border border-green-600/10 rounded-lg"
        style={{ top: '10%', right: '20%', width: 160, height: 160 }}
        animate={{
          opacity: [0.1, 0.2, 0.1],
          rotate: [0, 180],
          scale: [0.95, 1.05, 0.95]
        }}
        transition={{
          opacity: { duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
          rotate: { duration: 20, repeat: Infinity, ease: "linear" },
          scale: { duration: 8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
        }}
      />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
              <div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 lg:px-0 lg:text-left lg:flex lg:items-center">
                <div className="lg:py-24">
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center px-3 py-1 rounded-full bg-green-900/30 text-green-400 text-sm font-semibold mb-6"
                  >
                    <span className="mr-2">⚽️</span> Book your turf now
                  </motion.div>
                  
                  <motion.h1 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-6xl xl:text-7xl text-shadow"
                  >
                    <span className="block pb-2">Book Your</span>
                    <span className="block">
                      <motion.span 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="text-primary text-shadow-green"
                      >
                        Turf
                      </motion.span>
                      <span>time</span>
                    </span>
                  </motion.h1>
                  
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                    className="mt-6 text-xl text-gray-300 max-w-2xl"
                  >
                    Book premium sports turfs for cricket, football, and badminton with real-time availability and instant confirmation.
                  </motion.p>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.9 }}
                    className="flex flex-wrap gap-4 mt-8"
                  >
                    <Button asChild size="lg" className="px-6 font-semibold group">
                      <Link to="/auth">
                        <span className="inline-flex items-center">
                          Book Now
                          <motion.span
                            animate={{ x: [0, 4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
                            className="ml-2"
                          >
                            →
                          </motion.span>
                        </span>
                      </Link>
                    </Button>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.1 }}
                    className="mt-10 flex items-center gap-8"
                  >
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
                  </motion.div>
                </div>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.5 }}
                className="mt-12 lg:mt-0 lg:relative"
              >
                <div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 lg:max-w-none lg:px-0">
                  {/* Hero image with green gradient overlay */}
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-green-900/20">
                    <div className="absolute inset-0 bg-gradient-to-tr from-green-900/80 via-transparent to-transparent z-10"></div>
                    <img
                      className="w-full rounded-2xl"
                      src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1200&auto=format"
                      alt="Football turf field at night"
                    />
                    {/* Animated glow effect around the image */}
                    <motion.div
                      className="absolute -inset-1 rounded-2xl z-0"
                      animate={{
                        boxShadow: [
                          "0 0 0 rgba(74, 222, 128, 0)",
                          "0 0 20px rgba(74, 222, 128, 0.3)",
                          "0 0 0 rgba(74, 222, 128, 0)"
                        ]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        repeatType: "loop"
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
