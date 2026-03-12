/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from "react";

export default function ParticleField({ active }: { active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  const animationRefs = useRef<unknown[]>([]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let anime: any;
    import("animejs").then((animejs) => {
      anime = animejs.default;
      // Clean up previous animations
      animationRefs.current.forEach((anim) => {
        if (anim && typeof (anim as { pause?: () => void }).pause === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (anim as any).pause();
        }
      });
      animationRefs.current = [];

      if (!active || !containerRef.current) {
        // Fade out and stop
        if (particlesRef.current.length > 0) {
          anime({
            targets: particlesRef.current,
            opacity: 0,
            scale: 0.1,
            duration: 1000,
            easing: "easeOutExpo",
          });
        }
        return;
      }

      // Colors: olive and navy
      const colors = ["#778667", "#3e4260"];
      const numParticles = 25;
      
      // Create logic for floating particles
      for (let i = 0; i < numParticles; i++) {
        const el = particlesRef.current[i];
        if (!el) continue;
        
        // Reset position to center-ish
        anime.set(el, {
          translateX: anime.random(-40, 40),
          translateY: anime.random(-40, 40),
          scale: anime.random(0.2, 1),
          opacity: anime.random(0.3, 0.6),
          backgroundColor: colors[anime.random(0, 1)],
        });

        const anim = anime({
          targets: el,
          translateX: () => `+=${anime.random(-60, 60)}`,
          translateY: () => `+=${anime.random(-60, 60)}`,
          scale: () => anime.random(0.5, 1.5),
          opacity: [
            { value: anime.random(0.3, 0.8), duration: anime.random(500, 1000) },
            { value: 0.1, duration: anime.random(500, 1000) }
          ],
          easing: "easeInOutSine",
          duration: anime.random(2000, 4000),
          loop: true,
          direction: "alternate"
        });
        animationRefs.current.push(anim);
      }
    });

    return () => {
      animationRefs.current.forEach((anim) => {
        if (anim && typeof (anim as { pause?: () => void }).pause === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (anim as any).pause();
        }
      });
    };
  }, [active]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center"
    >
      {[...Array(25)].map((_, i) => (
        <div
          key={i}
          ref={(el) => { if(el) particlesRef.current[i] = el; }}
          className="absolute w-1.5 h-1.5 rounded-full opacity-0"
        />
      ))}
    </div>
  );
}
