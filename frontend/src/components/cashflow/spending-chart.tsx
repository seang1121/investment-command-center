"use client";

import { formatCurrency } from "@/lib/utils";

interface SpendingChartProps {
  data: Record<string, number>;
}

const CATEGORY_COLORS: Record<string, string> = {
  Housing: "bg-blue-500",
  Transportation: "bg-violet-500",
  "Food & Dining": "bg-amber-500",
  Utilities: "bg-cyan-500",
  Insurance: "bg-indigo-500",
  Healthcare: "bg-rose-500",
  Entertainment: "bg-pink-500",
  Shopping: "bg-orange-500",
  Subscriptions: "bg-teal-500",
  "Debt Payments": "bg-red-600",
  Other: "bg-gray-500",
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || "bg-gray-500";
}

export default function SpendingChart({ data }: SpendingChartProps) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  const total = entries.reduce((sum, [, val]) => sum + val, 0);
  const maxAmount = entries.length > 0 ? entries[0][1] : 1;

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">
        No spending data available.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(([category, amount]) => {
        const pct = total > 0 ? (amount / total) * 100 : 0;
        const barWidth = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;

        return (
          <div key={category}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-gray-300">{category}</span>
              <span className="text-gray-400">
                {formatCurrency(amount)}{" "}
                <span className="text-xs text-gray-600">
                  ({pct.toFixed(1)}%)
                </span>
              </span>
            </div>
            <div className="h-4 w-full rounded-full bg-gray-800">
              <div
                className={`h-4 rounded-full ${getCategoryColor(category)} transition-all`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        );
      })}

      <div className="mt-4 flex items-center justify-between border-t border-gray-800 pt-3 text-sm font-medium">
        <span className="text-gray-300">Total</span>
        <span className="text-white">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
