"use client";

import Link from "next/link";
import { usePreferences } from "@/contexts/preferences-context";

export interface Recommendation {
  type: "action" | "insight" | "warning";
  message: string;
  detail?: string;
  linkTo?: string;
  linkLabel?: string;
}

interface RecommendationPanelProps {
  recommendations: Recommendation[];
  title?: string;
}

const typeStyles: Record<
  Recommendation["type"],
  { border: string; icon: string; iconColor: string }
> = {
  action: {
    border: "border-emerald-500/20",
    icon: "M13 7l5 5m0 0l-5 5m5-5H6",
    iconColor: "text-emerald-400",
  },
  insight: {
    border: "border-blue-500/20",
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    iconColor: "text-blue-400",
  },
  warning: {
    border: "border-amber-500/20",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    iconColor: "text-amber-400",
  },
};

export default function RecommendationPanel({
  recommendations,
  title = "What This Means",
}: RecommendationPanelProps) {
  const { isSimple } = usePreferences();

  if (recommendations.length === 0) return null;

  // Simple mode: show top 3 most important (warnings first, then actions, then insights)
  const sorted = [...recommendations].sort((a, b) => {
    const order = { warning: 0, action: 1, insight: 2 };
    return order[a.type] - order[b.type];
  });
  const visible = isSimple ? sorted.slice(0, 3) : sorted;

  return (
    <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">{title}</h3>
      <div className="space-y-3">
        {visible.map((rec, i) => {
          const style = typeStyles[rec.type];
          return (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-lg border ${style.border} bg-gray-900/50 p-4`}
            >
              <svg
                className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconColor}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={style.icon}
                />
              </svg>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-200">{rec.message}</p>
                {rec.detail && (
                  <p className="mt-1 text-xs text-gray-500">{rec.detail}</p>
                )}
                {rec.linkTo && rec.linkLabel && (
                  <Link
                    href={rec.linkTo}
                    className="mt-2 inline-block text-xs font-medium text-emerald-400 transition-colors hover:text-emerald-300"
                  >
                    {rec.linkLabel} &rarr;
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {isSimple && recommendations.length > 3 && (
        <p className="mt-3 text-xs text-gray-600">
          Switch to Advanced mode to see {recommendations.length - 3} more
          insights
        </p>
      )}
    </div>
  );
}
