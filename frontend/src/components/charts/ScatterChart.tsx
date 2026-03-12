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
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis 
            type="number" 
            dataKey={xKey} 
            name={xKey} 
            tick={{ fill: '#3b3c36', fontSize: 12 }}
            axisLine={{ stroke: '#b2b49c' }}
          />
          <YAxis 
            type="number" 
            dataKey={yKey} 
            name={yKey} 
            tick={{ fill: '#3b3c36', fontSize: 12 }}
            axisLine={{ stroke: '#b2b49c' }}
          />
          <ZAxis range={[60, 60]} /> 
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ backgroundColor: '#f2eee3', borderRadius: '8px', border: '1px solid #b2b49c', color: '#3b3c36' }}
            itemStyle={{ color: '#3b3c36' }}
          />
          <Legend wrapperStyle={{ paddingTop: "20px" }} />
          <Scatter 
            name={`Relation between ${xKey} and ${yKey}`} 
            data={data} 
            fill="#4e79a7"
            animationDuration={1000}
            isAnimationActive={true}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
