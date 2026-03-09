"use client";

import dynamic from "next/dynamic";
import type { MonteCarloResponse } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Props {
  data: MonteCarloResponse;
}

export default function MonteCarloChart({ data }: Props) {
  const { percentiles, months } = data;
  const xLabels = months.map((m) =>
    m % 12 === 0 ? `Year ${m / 12}` : `Mo ${m}`
  );

  const traces = [
    // 5th-95th band (lightest)
    {
      x: xLabels,
      y: percentiles["95th"],
      type: "scatter" as const,
      mode: "lines" as const,
      line: { width: 0 },
      showlegend: false,
    },
    {
      x: xLabels,
      y: percentiles["5th"],
      type: "scatter" as const,
      mode: "lines" as const,
      fill: "tonexty" as const,
      fillcolor: "rgba(16, 185, 129, 0.08)",
      line: { width: 0 },
      name: "5th-95th",
    },
    // 25th-75th band (darker)
    {
      x: xLabels,
      y: percentiles["75th"],
      type: "scatter" as const,
      mode: "lines" as const,
      line: { width: 0 },
      showlegend: false,
    },
    {
      x: xLabels,
      y: percentiles["25th"],
      type: "scatter" as const,
      mode: "lines" as const,
      fill: "tonexty" as const,
      fillcolor: "rgba(16, 185, 129, 0.18)",
      line: { width: 0 },
      name: "25th-75th",
    },
    // Median line
    {
      x: xLabels,
      y: percentiles["50th"],
      type: "scatter" as const,
      mode: "lines" as const,
      line: { color: "#10b981", width: 2.5 },
      name: "Median",
    },
    // Mean line (dashed)
    {
      x: xLabels,
      y: percentiles["mean"],
      type: "scatter" as const,
      mode: "lines" as const,
      line: { color: "#6366f1", width: 1.5, dash: "dash" as const },
      name: "Mean",
    },
  ];

  return (
    <Plot
      data={traces}
      layout={{
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: { color: "#9ca3af", size: 12 },
        margin: { t: 30, b: 50, l: 80, r: 30 },
        xaxis: {
          gridcolor: "#1f2937",
          nticks: 10,
        },
        yaxis: {
          gridcolor: "#1f2937",
          tickformat: "$,.0f",
          title: { text: "Portfolio Value" },
        },
        legend: { x: 0, y: 1.15, orientation: "h" as const },
        hovermode: "x unified" as const,
      }}
      config={{ displayModeBar: false, responsive: true }}
      className="w-full"
      style={{ height: 450 }}
    />
  );
}
