import { motion } from "framer-motion";
import { Dribbble, CircleDot } from "lucide-react";
export default function AnimatedSportsIcons() {
    return (<div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Cricket Ball */}
      <motion.div className="absolute text-red-500/30" style={{ left: "10%", top: "20%" }} animate={{
            y: [0, -20, 0],
            rotate: [0, 360],
        }} transition={{
            y: { duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
            rotate: { duration: 8, repeat: Infinity, ease: "linear" },
        }}>
        <CircleDot size={48}/>
      </motion.div>

      {/* Football */}
      <motion.div className="absolute text-white/30" style={{ right: "15%", top: "15%" }} animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            rotate: [0, 45, 0],
        }} transition={{
            y: { duration: 5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
            x: { duration: 7, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
            rotate: { duration: 10, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
        }}>
        <Dribbble size={60}/>
      </motion.div>

      {/* Badminton Shuttlecock */}
      <motion.div className="absolute text-yellow-400/30" style={{ left: "20%", bottom: "25%" }} animate={{
            y: [0, 30, 0],
            rotate: [0, -20, 0],
        }} transition={{
            y: { duration: 6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
            rotate: { duration: 7, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
        }}>
        <CircleDot size={54}/>
      </motion.div>

      {/* Small Cricket Ball */}
      <motion.div className="absolute text-red-500/20" style={{ right: "25%", bottom: "20%" }} animate={{
            y: [0, 20, 0],
            x: [0, -15, 0],
            rotate: [0, -360],
        }} transition={{
            y: { duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
            x: { duration: 5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
            rotate: { duration: 7, repeat: Infinity, ease: "linear" },
        }}>
        <CircleDot size={36}/>
      </motion.div>

      {/* Small Football */}
      <motion.div className="absolute text-white/20" style={{ left: "30%", top: "60%" }} animate={{
            y: [0, -15, 0],
            rotate: [0, 30, 0],
        }} transition={{
            y: { duration: 3.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
            rotate: { duration: 5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
        }}>
        <Dribbble size={32}/>
      </motion.div>
    </div>);
}
