/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let anime: any;
    import("animejs").then((animejs) => {
      anime = animejs.default;
      if (containerRef.current) {
        anime({
          targets: containerRef.current,
          opacity: [0, 1],
          translateY: [10, 0],
          duration: 800,
          easing: 'easeOutExpo'
        });
      }
    });
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full opacity-0">
      {children}
    </div>
  );
}
