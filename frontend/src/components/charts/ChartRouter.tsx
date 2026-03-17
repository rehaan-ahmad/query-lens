import React from "react";
import BarChartComponent from "./BarChart";
import LineChartComponent from "./LineChart";
import PieChartComponent from "./PieChart";
import ScatterChartComponent from "./ScatterChart";
import StatCard from "./StatCard";

import CannotAnswerAnimation from "../animation/CannotAnswerAnimation";

type ChartRouterProps = {
  chartType?: string;
  data?: Record<string, unknown>[];
  columns?: string[];
  explanation?: string;
};

export default function ChartRouter({ chartType, data, explanation }: ChartRouterProps) {
  if (!chartType) return null;

  if (chartType === "cannot_answer") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-foreground bg-surface rounded-xl shadow-sm border border-muted/20">
        <CannotAnswerAnimation />
        <p className="text-muted text-pretty max-w-sm font-medium text-lg">
          Cannot answer due to : {explanation || "Inventory missing relevant info."}
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
