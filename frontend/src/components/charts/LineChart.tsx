"use client";
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { tooltipStyle, CHAT_COLORS } from "./chartTheme";

export default function LineChartComponent({ data }: { data: Record<string, unknown>[];  }) {
  if (!data || data.length === 0) return null;

  const keys = Object.keys(data[0]);
  const xKey = keys[0];
  const lineKeys = keys.slice(1);


  return (
    <div className="w-full h-full min-h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
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
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ paddingTop: "20px" }} />
          {lineKeys.map((key, index) => (
            <Line 
              key={key} 
              type="monotone" 
              dataKey={key} 
              stroke={CHAT_COLORS[index % CHAT_COLORS.length]} 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              animationDuration={1500}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
