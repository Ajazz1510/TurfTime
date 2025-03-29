import { useEffect, useState } from "react";
import { motion } from "framer-motion";
export default function AnimatedBackground({ className }) {
    const [dots, setDots] = useState([]);
    useEffect(() => {
        // Create background dots based on screen size
        const generateDots = () => {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const numberOfDots = Math.floor((windowWidth * windowHeight) / 15000); // Adjust density
            const newDots = [];
            for (let i = 0; i < numberOfDots; i++) {
                newDots.push({
                    x: Math.random() * 100, // % of screen width
                    y: Math.random() * 100, // % of screen height
                    size: Math.random() * 3 + 1, // Between 1-4px
                    delay: Math.random() * 5, // Delay animation start
                });
            }
            setDots(newDots);
        };
        generateDots();
        // Regenerate on resize
        window.addEventListener("resize", generateDots);
        return () => window.removeEventListener("resize", generateDots);
    }, []);
    return (<div className={`fixed inset-0 -z-10 overflow-hidden pointer-events-none ${className || ""}`}>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-green-950/30 opacity-90"></div>
      
      {/* Animated green pattern */}
      <div className="absolute inset-0">
        <svg className="w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(74, 222, 128, 0.2)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)"/>
        </svg>
      </div>

      {/* Animated dots */}
      {dots.map((dot, index) => (<motion.div key={index} className="absolute rounded-full bg-green-400" style={{
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                width: `${dot.size}px`,
                height: `${dot.size}px`,
            }} initial={{ opacity: 0 }} animate={{
                opacity: [0, 0.7, 0],
                scale: [1, 1.5, 1],
            }} transition={{
                duration: 4,
                delay: dot.delay,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
            }}/>))}

      {/* Animated light beams */}
      <motion.div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-green-500/10 to-green-300/5 blur-3xl" animate={{
            x: ["-20%", "120%"],
            y: ["10%", "60%"],
        }} transition={{
            x: { duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
            y: { duration: 15, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
        }}/>
      
      <motion.div className="absolute w-[300px] h-[300px] rounded-full bg-gradient-to-r from-emerald-500/10 to-emerald-300/5 blur-3xl" animate={{
            x: ["70%", "30%"],
            y: ["70%", "30%"],
        }} transition={{
            x: { duration: 18, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
            y: { duration: 14, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
        }}/>
    </div>);
}
