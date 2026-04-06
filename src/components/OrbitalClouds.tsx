import { useEffect, useRef } from "react";

interface Cloud {
  x: number;
  y: number;
  size: number;
  opacity: number;
  phase: "in" | "visible" | "out";
  timer: number;
  fadeDuration: number;
  visibleDuration: number;
  hue: number;
  sat: number;
  light: number;
}

const OrbitalClouds = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const clouds: Cloud[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    const hueOptions = [270, 280, 290, 40, 35, 45, 300];

    const spawnCloud = (): Cloud => {
      const hue = hueOptions[Math.floor(Math.random() * hueOptions.length)];
      return {
        x: Math.random() * w(),
        y: Math.random() * h(),
        size: 80 + Math.random() * 180,
        opacity: 0,
        phase: "in",
        timer: 0,
        fadeDuration: 40 + Math.random() * 60,
        visibleDuration: 30 + Math.random() * 80,
        hue,
        sat: 45 + Math.random() * 35,
        light: 55 + Math.random() * 25,
      };
    };

    // Start with some clouds at random phases
    for (let i = 0; i < 12; i++) {
      const c = spawnCloud();
      c.phase = "visible";
      c.opacity = 0.3 + Math.random() * 0.4;
      c.timer = Math.random() * c.visibleDuration;
      clouds.push(c);
    }

    const maxClouds = 16;

    const draw = () => {
      ctx.clearRect(0, 0, w(), h());

      // Spawn new clouds if needed
      if (clouds.length < maxClouds && Math.random() < 0.03) {
        clouds.push(spawnCloud());
      }

      for (let i = clouds.length - 1; i >= 0; i--) {
        const c = clouds[i];
        c.timer++;

        if (c.phase === "in") {
          c.opacity = Math.min(0.6, (c.timer / c.fadeDuration) * 0.6);
          if (c.timer >= c.fadeDuration) {
            c.phase = "visible";
            c.timer = 0;
          }
        } else if (c.phase === "visible") {
          // Gentle pulse while visible
          c.opacity = 0.35 + Math.sin(c.timer * 0.05) * 0.2;
          if (c.timer >= c.visibleDuration) {
            c.phase = "out";
            c.timer = 0;
          }
        } else if (c.phase === "out") {
          c.opacity = Math.max(0, 0.5 * (1 - c.timer / c.fadeDuration));
          if (c.timer >= c.fadeDuration) {
            clouds.splice(i, 1);
            continue;
          }
        }

        const gradient = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size);
        gradient.addColorStop(0, `hsla(${c.hue}, ${c.sat}%, ${c.light}%, ${c.opacity})`);
        gradient.addColorStop(0.5, `hsla(${c.hue}, ${c.sat}%, ${c.light}%, ${c.opacity * 0.35})`);
        gradient.addColorStop(1, `hsla(${c.hue}, ${c.sat}%, ${c.light}%, 0)`);

        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[1]"
    />
  );
};

export default OrbitalClouds;
