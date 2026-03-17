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

export default function BarChartComponent({ data }: { data: Record<string, unknown>[];  }) {
  if (!data || data.length === 0) return null;

  // Assuming first column is categorical (X) and rest are numerical (Bars)
  const keys = Object.keys(data[0]);
  const xKey = keys[0];
  const barKeys = keys.slice(1);

  const colors = ["#4e79a7", "#f28e2b", "#59a14f", "#e15759", "#76b7b2"];

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
            contentStyle={{ backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--muted)', color: 'var(--foreground)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ color: 'var(--foreground)' }}
          />
          <Legend wrapperStyle={{ paddingTop: "20px" }} />
          {barKeys.map((key, index) => (
            <Bar 
              key={key} 
              dataKey={key} 
              fill={colors[index % colors.length]} 
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
