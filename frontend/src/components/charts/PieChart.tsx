"use client";
import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function PieChartComponent({ data }: { data: Record<string, unknown>[];  }) {
  if (!data || data.length === 0) return null;

  const keys = Object.keys(data[0]);
  const nameKey = keys[0];
  const valueKey = keys[1];

  const COLORS = ["#4e79a7", "#f28e2b", "#59a14f", "#e15759", "#76b7b2", "#edc948", "#b07aa1"];

  // Prepare data (ensure values are numeric)
  const chartData = data.map(item => ({
    name: String(item[nameKey]),
    value: Number(item[valueKey]) || 0
  })).filter(item => item.value > 0);

  return (
    <div className="w-full h-full min-h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={140}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            animationDuration={1000}
            label={({ name, percent }: { name?: string, percent?: number }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--muted)', color: 'var(--foreground)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ color: 'var(--foreground)' }}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
