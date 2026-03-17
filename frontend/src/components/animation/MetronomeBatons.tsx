"use client";
import React from "react";
import styles from "./MetronomeBatons.module.scss";

interface MetronomeBatonsProps {
  active: boolean;
}

export default function MetronomeBatons({ active }: MetronomeBatonsProps) {
  if (!active) return null;

  const batons = Array.from({ length: 36 });

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
      <div className={styles.container}>
        {batons.map((_, i) => (
          <div key={`baton-${i}`} className={styles[`baton-${i}`]}>
            <div className={styles.metronome}>
              <div className={styles.baton}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
