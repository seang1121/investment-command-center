"use client";

import { useState } from "react";
import { usePreferences } from "@/contexts/preferences-context";
import { TRANSLATIONS } from "@/lib/metric-translations";
import type { Verdict } from "@/lib/metric-translations";
import MetricCard from "./metric-card";

interface SmartMetricCardProps {
  metricKey: string;
  value: number | null;
  rawLabel: string;
  rawValue: string;
  subtitle?: string;
  color?: "green" | "red" | "amber" | "blue" | "default";
}

const verdictColors: Record<Verdict["status"], "green" | "amber" | "red"> = {
  good: "green",
  warning: "amber",
  bad: "red",
};

const verdictDots: Record<Verdict["status"], string> = {
  good: "bg-emerald-400",
  warning: "bg-amber-400",
  bad: "bg-red-400",
};

export default function SmartMetricCard({
  metricKey,
  value,
  rawLabel,
  rawValue,
  subtitle,
  color = "default",
}: SmartMetricCardProps) {
  const { isSimple } = usePreferences();
  const [showExplanation, setShowExplanation] = useState(false);

  const translation = TRANSLATIONS[metricKey];

  // No translation or advanced mode — render the original card
  if (!translation || !isSimple || value === null) {
    return (
      <MetricCard
        label={rawLabel}
        value={rawValue}
        subtitle={subtitle}
        color={color}
      />
    );
  }

  const verdict = translation.verdict(value);
  const simpleValue = translation.simpleFormat(value);
  const resolvedColor = verdictColors[verdict.status];

  return (
    <div className="relative">
      <MetricCard
        label={translation.simpleLabel}
        value={simpleValue}
        subtitle={verdict.message}
        color={resolvedColor}
      />

      {/* Verdict dot */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${verdictDots[verdict.status]}`}
        />
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-gray-600 transition-colors hover:text-gray-400"
          aria-label="More info"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>

      {/* Explanation tooltip */}
      {showExplanation && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-gray-700 bg-gray-900 p-3 text-xs text-gray-300 shadow-xl">
          <p>{translation.explanation}</p>
          <p className="mt-1 text-gray-500">
            Advanced: {rawLabel} = {rawValue}
          </p>
        </div>
      )}
    </div>
  );
}
