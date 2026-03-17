"use client";
import React from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { tooltipStyle, CHAT_COLORS } from "./chartTheme";

export default function ScatterChartComponent({ data }: { data: Record<string, unknown>[];  }) {
  if (!data || data.length === 0) return null;

  const keys = Object.keys(data[0]);
  const xKey = keys[0];
  const yKey = keys[1];

  return (
    <div className="w-full h-full min-h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" strokeOpacity={0.2} />
          <XAxis 
            type="number" 
            dataKey={xKey} 
            name={xKey} 
            tick={{ fill: 'var(--foreground)', fontSize: 12, opacity: 0.8 }}
            axisLine={{ stroke: 'var(--muted)', opacity: 0.3 }}
          />
          <YAxis 
            type="number" 
            dataKey={yKey} 
            name={yKey} 
            tick={{ fill: 'var(--foreground)', fontSize: 12, opacity: 0.8 }}
            axisLine={{ stroke: 'var(--muted)', opacity: 0.3 }}
          />
          <ZAxis range={[60, 60]} /> 
          <Tooltip 
            cursor={{ strokeDasharray: '3 3', stroke: 'var(--muted)' }}
            {...tooltipStyle}
          />
          <Legend wrapperStyle={{ paddingTop: "20px" }} />
          <Scatter 
            name={`Relation between ${xKey} and ${yKey}`} 
            data={data} 
            fill={CHAT_COLORS[0]}
            animationDuration={1000}
            isAnimationActive={true}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
