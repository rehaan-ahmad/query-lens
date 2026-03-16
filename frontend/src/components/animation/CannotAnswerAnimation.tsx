import React, { useEffect, useRef } from "react";
import anime from "animejs";

export default function CannotAnswerAnimation() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      anime({
        targets: svgRef.current.querySelectorAll('.line'),
        strokeDashoffset: [anime.setDashoffset, 0],
        easing: 'easeInOutQuad',
        duration: 2000,
        delay: anime.stagger(100),
        loop: true,
        direction: 'normal'
      });
    }
  }, []);

  return (
    <svg ref={svgRef} viewBox="0 0 320 100" className="w-56 h-auto mb-6 text-red-500/80">
      <g stroke="currentColor" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        {/* E */}
        <path className="line" d="M 60 10 L 20 10 L 20 90 L 60 90 M 20 50 L 50 50" />
        {/* R */}
        <path className="line" d="M 80 90 L 80 10 C 120 10, 120 50, 80 50 L 120 90" />
        {/* R */}
        <path className="line" d="M 140 90 L 140 10 C 180 10, 180 50, 140 50 L 180 90" />
        {/* O */}
        <path className="line" d="M 220 10 A 20 40 0 0 1 220 90 A 20 40 0 0 1 220 10" />
        {/* R */}
        <path className="line" d="M 260 90 L 260 10 C 300 10, 300 50, 260 50 L 300 90" />
      </g>
    </svg>
  );
}
