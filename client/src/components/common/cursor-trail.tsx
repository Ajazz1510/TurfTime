import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";

interface CursorTrailProps {
  className?: string;
  color?: string;
  particleCount?: number;
  particleSize?: number;
  particleDecayRate?: number; 
}

interface Point {
  x: number;
  y: number;
  id: number;
  decay: number;
  scale: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
  hue: number;
}

export default function CursorTrail({ 
  className,
  color = "rgb(74, 222, 128)", // Default to primary green color
  particleCount = 30,
  particleSize = 20,
  particleDecayRate = 0.02
}: CursorTrailProps) {
  const [points, setPoints] = useState<Point[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Convert the CSS color to HSL components for variation
  const baseColor = useMemo(() => {
    return { h: 142, s: 77, l: 58 }; // Approximate HSL values for the green primary
  }, [color]);
  
  useEffect(() => {
    if (!isEnabled) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let animationFrameId: number;
    let lastX = 0;
    let lastY = 0;
    let lastTimestamp = 0;
    let velocityX = 0;
    let velocityY = 0;
    let counter = 0;

    const addPoint = (x: number, y: number, clientX: number, clientY: number) => {
      // Calculate velocity based on distance moved
      const now = Date.now();
      const elapsed = now - lastTimestamp;
      
      if (elapsed > 0) {
        // Update velocity (with smoothing)
        const newVelocityX = (clientX - lastX) / elapsed;
        const newVelocityY = (clientY - lastY) / elapsed;
        
        velocityX = velocityX * 0.5 + newVelocityX * 0.5;
        velocityY = velocityY * 0.5 + newVelocityY * 0.5;
        
        lastTimestamp = now;
      }
      
      // Skip if the cursor hasn't moved much to avoid excessive particles at rest
      const distanceMoved = Math.sqrt(Math.pow(clientX - lastX, 2) + Math.pow(clientY - lastY, 2));
      if (distanceMoved < 3) return;
      
      lastX = clientX;
      lastY = clientY;

      // Add multiple points with slight variations for a smoky effect
      const pointsToAdd = Math.min(3, Math.ceil(distanceMoved / 20));
      const newPoints: Point[] = [];
      
      for (let i = 0; i < pointsToAdd; i++) {
        // Add random variation to position within a small radius
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 5;
        const offsetX = Math.cos(angle) * distance;
        const offsetY = Math.sin(angle) * distance;
        
        // Calculate hue variation (green to yellow-green)
        const hueVariation = baseColor.h + (Math.random() * 20 - 10);
        
        newPoints.push({
          x: x + offsetX,
          y: y + offsetY,
          id: counter++,
          decay: 1,
          scale: 0.6 + Math.random() * 0.8, // Larger variation in sizes
          rotation: Math.random() * 360,
          velocityX: velocityX * 50 + (Math.random() - 0.5) * 2, // Add some randomness to velocity
          velocityY: velocityY * 50 + (Math.random() - 0.5) * 2 - 1, // Slight upward drift like smoke
          hue: hueVariation
        });
      }

      setPoints(prevPoints => [
        ...prevPoints.slice(-(particleCount - newPoints.length)),
        ...newPoints
      ]);
    };

    const updatePoints = () => {
      setPoints(prevPoints => 
        prevPoints
          .map(point => {
            // Apply velocity and physics to points
            const newX = point.x + point.velocityX * 0.05;
            const newY = point.y + point.velocityY * 0.05;
            
            // Gradually reduce velocity (air resistance)
            const drag = 0.96;
            
            return {
              ...point,
              x: newX,
              y: newY,
              velocityX: point.velocityX * drag,
              velocityY: point.velocityY * drag - 0.05, // More pronounced upward drift like smoke
              decay: point.decay - particleDecayRate,
              scale: point.scale * 1.01, // Gradually increase size more as particles fade
              rotation: point.rotation + 0.2 // Slow rotation
            };
          })
          .filter(point => point.decay > 0) // Remove fully faded points
      );
      
      animationFrameId = requestAnimationFrame(updatePoints);
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Throttle point addition
      if (timeoutId !== null) return;
      
      timeoutId = setTimeout(() => {
        addPoint(e.clientX, e.clientY, e.clientX, e.clientY);
        timeoutId = null;
      }, 10);
    };

    // Start the animation loop
    animationFrameId = requestAnimationFrame(updatePoints);
    
    // Add event listener for mouse movement
    window.addEventListener("mousemove", handleMouseMove);

    // Clean up
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isEnabled, particleCount, particleDecayRate, baseColor]);

  // Disable on mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsEnabled(window.innerWidth > 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return (
    <div className={`pointer-events-none fixed inset-0 z-50 overflow-hidden ${className}`}>
      {/* Main cursor dot */}
      <motion.div
        className="absolute rounded-full bg-primary/60 blur-sm"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          width: '10px',
          height: '10px',
          transform: 'translate(-50%, -50%)',
        }}
      />
      
      {/* Smoke particles */}
      {points.map(point => {
        // Calculate color based on decay and hue
        const hue = point.hue; 
        const saturation = Math.max(0, Math.min(100, baseColor.s * (1 - point.decay * 0.5))); // Desaturate as it fades
        const lightness = Math.max(0, Math.min(100, baseColor.l + (1 - point.decay) * 30)); // Get lighter as it fades
        
        const particleColor = `hsla(${hue}, ${saturation}%, ${lightness}%, ${point.decay * 0.5})`;
        
        return (
          <motion.div
            key={point.id}
            className="absolute rounded-full blur-md"
            style={{
              left: point.x,
              top: point.y,
              width: `${particleSize * point.scale}px`,
              height: `${particleSize * point.scale}px`,
              backgroundColor: particleColor,
              transform: `translate(-50%, -50%) scale(${point.scale}) rotate(${point.rotation}deg)`,
            }}
            initial={{ scale: 0 }}
            animate={{ 
              scale: point.scale,
              opacity: point.decay * 0.8
            }}
            transition={{ duration: 0.15 }}
          />
        );
      })}
    </div>
  );
}