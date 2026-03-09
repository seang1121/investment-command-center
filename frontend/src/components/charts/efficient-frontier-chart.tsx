"use client";

import dynamic from "next/dynamic";
import type { OptimizationResponse } from "@/lib/types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Props {
  data: OptimizationResponse;
}

export default function EfficientFrontierChart({ data }: Props) {
  const traces = [
    // Random portfolios (colored by Sharpe)
    {
      x: data.frontier.map((p) => p.volatility * 100),
      y: data.frontier.map((p) => p.return * 100),
      type: "scatter" as const,
      mode: "markers" as const,
      marker: {
        size: 3,
        color: data.frontier.map((p) => p.sharpe),
        colorscale: "Viridis",
        colorbar: { title: "Sharpe", tickformat: ".2f" },
        opacity: 0.5,
      },
      name: "Portfolios",
      hovertemplate:
        "Return: %{y:.1f}%<br>Volatility: %{x:.1f}%<br>Sharpe: %{text}",
      text: data.frontier.map((p) => p.sharpe.toFixed(2)),
    },
    // Max Sharpe point
    {
      x: [data.max_sharpe.volatility * 100],
      y: [data.max_sharpe.return * 100],
      type: "scatter" as const,
      mode: "markers" as const,
      marker: { size: 14, color: "#10b981", symbol: "star" },
      name: `Max Sharpe (${data.max_sharpe.sharpe.toFixed(2)})`,
    },
    // Min Volatility point
    {
      x: [data.min_volatility.volatility * 100],
      y: [data.min_volatility.return * 100],
      type: "scatter" as const,
      mode: "markers" as const,
      marker: { size: 14, color: "#3b82f6", symbol: "diamond" },
      name: `Min Vol (${data.min_volatility.sharpe.toFixed(2)})`,
    },
    // Individual assets
    {
      x: data.individual_assets.map((a) => a.volatility * 100),
      y: data.individual_assets.map((a) => a.return * 100),
      type: "scatter" as const,
      mode: "text+markers" as const,
      marker: { size: 10, color: "#f59e0b" },
      text: data.individual_assets.map((a) => a.ticker),
      textposition: "top center" as const,
      textfont: { color: "#f59e0b", size: 11 },
      name: "Individual Assets",
    },
  ];

  return (
    <Plot
      data={traces}
      layout={{
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: { color: "#9ca3af", size: 12 },
        margin: { t: 30, b: 60, l: 70, r: 30 },
        xaxis: {
          title: { text: "Volatility (%)" },
          gridcolor: "#1f2937",
        },
        yaxis: {
          title: { text: "Expected Return (%)" },
          gridcolor: "#1f2937",
        },
        legend: { x: 0, y: 1.15, orientation: "h" as const },
        hovermode: "closest" as const,
      }}
      config={{ displayModeBar: false, responsive: true }}
      className="w-full"
      style={{ height: 500 }}
    />
  );
}
