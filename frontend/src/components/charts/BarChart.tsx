"use client";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from "recharts";
import { tooltipStyle, CHAT_COLORS } from "./chartTheme";

export default function BarChartComponent({ data }: { data: Record<string, unknown>[];  }) {
  if (!data || data.length === 0) return null;

  // Assuming first column is categorical (X) and rest are numerical (Bars)
  const keys = Object.keys(data[0]);
  const xKey = keys[0];
  const barKeys = keys.slice(1);


  return (
    <div className="w-full h-full min-h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted)" strokeOpacity={0.2} />
          <XAxis 
            dataKey={xKey} 
            tick={{ fill: 'var(--foreground)', fontSize: 12, opacity: 0.8 }}
            tickMargin={10}
            axisLine={{ stroke: 'var(--muted)', opacity: 0.3 }}
          />
          <YAxis 
            tick={{ fill: 'var(--foreground)', fontSize: 12, opacity: 0.8 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
            {...tooltipStyle}
          />
          <Legend wrapperStyle={{ paddingTop: "20px" }} />
          {barKeys.map((key, index) => (
            <Bar 
              key={key} 
              dataKey={key} 
              fill={CHAT_COLORS[index % CHAT_COLORS.length]} 
              radius={[4, 4, 0, 0]}
              animationDuration={800}
              isAnimationActive={true}
            />
          ))}
          {data.length > 20 && (
            <Brush dataKey={xKey} height={30} stroke="var(--muted)" fill="var(--surface)" />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
