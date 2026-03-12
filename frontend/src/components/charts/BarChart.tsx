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
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
          <XAxis 
            dataKey={xKey} 
            tick={{ fill: '#3b3c36', fontSize: 12 }}
            tickMargin={10}
            axisLine={{ stroke: '#b2b49c' }}
          />
          <YAxis 
            tick={{ fill: '#3b3c36', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            cursor={{ fill: '#f2eee3', opacity: 0.4 }}
            contentStyle={{ backgroundColor: '#f2eee3', borderRadius: '8px', border: '1px solid #b2b49c', color: '#3b3c36', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
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
            <Brush dataKey={xKey} height={30} stroke="#778667" fill="#f2eee3" />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
