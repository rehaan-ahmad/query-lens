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

export default function LineChartComponent({ data }: { data: Record<string, unknown>[];  }) {
  if (!data || data.length === 0) return null;

  const keys = Object.keys(data[0]);
  const xKey = keys[0];
  const lineKeys = keys.slice(1);

  const colors = ["#4e79a7", "#f28e2b", "#59a14f", "#e15759", "#76b7b2"];

  return (
    <div className="w-full h-full min-h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
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
            contentStyle={{ backgroundColor: '#f2eee3', borderRadius: '8px', border: '1px solid #b2b49c', color: '#3b3c36' }}
          />
          <Legend wrapperStyle={{ paddingTop: "20px" }} />
          {lineKeys.map((key, index) => (
            <Line 
              key={key} 
              type="monotone" 
              dataKey={key} 
              stroke={colors[index % colors.length]} 
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
