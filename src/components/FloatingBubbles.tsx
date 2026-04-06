import { useRef } from "react";

interface Particle {
  x: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

const FloatingBubbles = ({ count = 25 }: { count?: number }) => {
  const particles = useRef<Particle[]>(
    Array.from({ length: count }, () => ({
      x: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 14 + 16,
      delay: Math.random() * 18,
      opacity: Math.random() * 0.5 + 0.2,
    }))
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      {particles.current.map((p, i) => {
        const isPink = i % 3 !== 0;
        return (
          <span
            key={i}
            className="absolute animate-bubble"
            style={{
              left: `${p.x}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              borderRadius: "50%",
              background: isPink
                ? `hsla(330, 70%, 85%, 0.9)`
                : `hsla(40, 65%, 78%, 0.9)`,
              boxShadow: isPink
                ? `0 0 ${p.size * 3}px ${p.size}px hsla(330, 70%, 85%, 0.4), 0 0 ${p.size * 6}px ${p.size * 2}px hsla(330, 60%, 88%, 0.15)`
                : `0 0 ${p.size * 3}px ${p.size}px hsla(40, 65%, 78%, 0.4), 0 0 ${p.size * 6}px ${p.size * 2}px hsla(40, 55%, 82%, 0.15)`,
              filter: `blur(${p.size * 0.3}px)`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        );
      })}
    </div>
  );
};

export default FloatingBubbles;
