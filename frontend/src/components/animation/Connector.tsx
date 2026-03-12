/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from "react";

type Phase = "idle" | "querying" | "delivering" | "ready";

export default function Connector({ phase }: { phase: Phase }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const squaresRef = useRef<HTMLDivElement[]>([]);
  // Use any for AnimeInstance to avoid TS error with the ES import
  const animationRef = useRef<unknown>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let anime: any;
    import("animejs").then((animejs) => {
      anime = animejs.default;
    // Clear any previous animation
    if (animationRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (animationRef.current as any).pause();
    }

    if (phase === "idle") {
      anime({
        targets: squaresRef.current,
        translateY: 0,
        scale: 1,
        backgroundColor: "#3e4260", // navy
        opacity: 0.3,
        duration: 500,
        easing: 'easeOutExpo'
      });
    }

    if (phase === "querying") {
      animationRef.current = anime({
        targets: squaresRef.current,
        translateY: [
          { value: -10, duration: 400, easing: 'easeOutQuad' },
          { value: 0, duration: 400, easing: 'easeInQuad' }
        ],
        backgroundColor: "#3e4260", // navy
        opacity: 0.8,
        delay: anime.stagger(150),
        loop: true
      });
    }

    if (phase === "delivering") {
      // Act 2: Spread animation, then color shift
      const tl = anime.timeline({
        easing: 'easeOutExpo',
      });

      tl.add({
        targets: squaresRef.current,
        scale: [1, 1.5, 1],
        translateX: (el: HTMLElement, i: number) => i === 0 ? -15 : i === 2 ? 15 : 0,
        backgroundColor: "#778667", // olive
        opacity: 1,
        duration: 600,
      }).add({
        targets: squaresRef.current,
        translateX: 0,
        duration: 400,
      });
      animationRef.current = tl;
    }

    if (phase === "ready") {
      // Act 3: Fade out
      anime({
        targets: squaresRef.current,
        opacity: 0,
        scale: 0.5,
        duration: 800,
        easing: 'easeOutExpo'
      });
    }

    });

    return () => {
      if (animationRef.current) {
        (animationRef.current as { pause: () => void }).pause();
      }
    }
  }, [phase]);

  return (
    <div ref={containerRef} className="flex space-x-3 items-center justify-center h-8">
      {[0, 1, 2].map((i) => (
        <div 
          key={i}
          ref={(el) => { if(el) squaresRef.current[i] = el; }}
          className="w-3 h-3 rounded-sm bg-navy opacity-30 shadow-sm"
        />
      ))}
    </div>
  );
}
