"use client";

import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useTheme } from "next-themes";

const ParticleBackground = () => {
  const [ready, setReady] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  if (!ready) return null;

  const isDark = resolvedTheme === "dark";
  const color = isDark ? "#6366f1" : "#818cf8";

  return (
    <Particles
      key={resolvedTheme}
      id="tsparticles"
      className="fixed inset-0 -z-10"
      options={{
        background: { color: { value: "transparent" } },
        fpsLimit: 60,
        particles: {
          number: { value: 60, density: { enable: true } },
          color: { value: color },
          opacity: {
            value: { min: isDark ? 0.05 : 0.08, max: isDark ? 0.25 : 0.35 },
            animation: { enable: true, speed: 0.5, sync: false },
          },
          size: { value: { min: 1, max: 3 } },
          links: {
            enable: true,
            distance: 140,
            color: color,
            opacity: isDark ? 0.08 : 0.12,
            width: 1,
          },
          move: {
            enable: true,
            speed: 0.4,
            direction: "none",
            random: true,
            outModes: { default: "bounce" },
          },
        },
        detectRetina: true,
      }}
    />
  );
};

export default ParticleBackground;
