import { useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  isPink: boolean;
}

const HeroLights = ({ count = 20 }: { count?: number }) => {
  const particles = useRef<Particle[]>(
    Array.from({ length: count }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 5 + 2,
      duration: Math.random() * 12 + 14,
      delay: Math.random() * 16,
      opacity: Math.random() * 0.6 + 0.25,
      isPink: i % 3 !== 0,
    }))
  );

  return (
    <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden" aria-hidden="true">
      {particles.current.map((p, i) => (
        <span
          key={i}
          className="absolute animate-bubble"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            borderRadius: "50%",
            background: p.isPink
              ? `hsla(330, 70%, 85%, 0.9)`
              : `hsla(40, 65%, 78%, 0.9)`,
            boxShadow: p.isPink
              ? `0 0 ${p.size * 3}px ${p.size}px hsla(330, 70%, 85%, 0.4), 0 0 ${p.size * 6}px ${p.size * 2}px hsla(330, 60%, 88%, 0.15)`
              : `0 0 ${p.size * 3}px ${p.size}px hsla(40, 65%, 78%, 0.4), 0 0 ${p.size * 6}px ${p.size * 2}px hsla(40, 55%, 82%, 0.15)`,
            filter: `blur(${p.size * 0.3}px)`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

export default HeroLights;
