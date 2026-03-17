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
import { tooltipStyle, CHAT_COLORS } from "./chartTheme";

export default function PieChartComponent({ data }: { data: Record<string, unknown>[];  }) {
  if (!data || data.length === 0) return null;

  const keys = Object.keys(data[0]);
  const nameKey = keys[0];
  const valueKey = keys[1];


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
              <Cell key={`cell-${index}`} fill={CHAT_COLORS[index % CHAT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
