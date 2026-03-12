"use client";
import React, { useEffect, useState } from "react";

export default function StatCard({ data }: { data: Record<string, unknown>[];  }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  // Extract the single value to display
  let targetValue = 0;
  let label = "Result";
  
  if (data && data.length > 0) {
    const row = data[0];
    const keys = Object.keys(row);
    if (keys.length > 0) {
      targetValue = Number(row[keys[0]]) || 0;
      label = keys[0];
    }
  }

  // Count up animation
  useEffect(() => {
    const start = 0;
    const duration = 1000;
    const startTime = performance.now();
    
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setDisplayValue(start + (targetValue - start) * ease);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValue);
      }
    };
    
    requestAnimationFrame(animate);
  }, [targetValue]);

  // Format the number (e.g., currency if it looks like price/tax, or standard formatting)
  const isCurrency = label.toLowerCase().includes("price") || label.toLowerCase().includes("tax") || label.toLowerCase().includes("cost");
  const formattedValue = new Intl.NumberFormat("en-GB", {
    style: isCurrency ? "currency" : "decimal",
    currency: "GBP",
    maximumFractionDigits: targetValue % 1 === 0 ? 0 : 2
  }).format(displayValue);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="bg-surface rounded-2xl p-12 shadow-sm border border-muted/20 text-center flex flex-col items-center min-w-[300px]">
        <h4 className="text-muted font-sans text-sm tracking-wider uppercase mb-4">
          {label.replace(/_/g, " ")}
        </h4>
        <div className="text-5xl md:text-7xl font-sans font-light text-navy tracking-tight">
          {formattedValue}
        </div>
      </div>
    </div>
  );
}
