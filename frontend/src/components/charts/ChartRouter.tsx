import React from "react";
import BarChartComponent from "./BarChart";
import LineChartComponent from "./LineChart";
import PieChartComponent from "./PieChart";
import ScatterChartComponent from "./ScatterChart";
import StatCard from "./StatCard";
import { ShieldAlert } from "lucide-react";

type ChartRouterProps = {
  chartType?: string;
  data?: Record<string, unknown>[];
  columns?: string[];
};

export default function ChartRouter({ chartType, data }: ChartRouterProps) {
  if (!chartType) return null;

  if (chartType === "cannot_answer") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-ink bg-surface rounded-xl shadow-sm border border-muted/20">
        <ShieldAlert className="w-12 h-12 text-olive mb-4 opacity-80" />
        <h3 className="text-xl font-serif mb-2">No Data Available</h3>
        <p className="text-muted text-pretty max-w-sm">
          I could not find data to answer that question from the available inventory.
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  switch (chartType) {
    case "bar":
      return <BarChartComponent data={data} />;
    case "line":
      return <LineChartComponent data={data} />;
    case "pie":
      return <PieChartComponent data={data} />;
    case "scatter":
      return <ScatterChartComponent data={data} />;
    case "stat_card":
      return <StatCard data={data} />;
    default:
      // Fallback
      return <BarChartComponent data={data} />;
  }
}
