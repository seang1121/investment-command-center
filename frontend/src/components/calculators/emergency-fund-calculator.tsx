"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";

export default function EmergencyFundCalculator() {
  const [expenses, setExpenses] = useState<number>(3000);
  const [months, setMonths] = useState<number>(6);
  const [currentSaved, setCurrentSaved] = useState<number>(0);
  const [monthlySaving, setMonthlySaving] = useState<number>(500);

  const result = useMemo(() => {
    const target = expenses * months;
    const remaining = Math.max(0, target - currentSaved);
    const monthsToGoal =
      monthlySaving > 0 ? Math.ceil(remaining / monthlySaving) : Infinity;
    const pctComplete = target > 0 ? Math.min(1, currentSaved / target) : 0;

    return { target, remaining, monthsToGoal, pctComplete };
  }, [expenses, months, currentSaved, monthlySaving]);

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-gray-900/80 p-6">
      <h3 className="mb-4 text-lg font-semibold text-emerald-400">
        Emergency Fund Calculator
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-gray-400">Monthly Expenses</span>
          <input
            type="number"
            value={expenses}
            onChange={(e) => setExpenses(Number(e.target.value))}
            min={0}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-400">Months to Cover</span>
          <div className="mt-1 flex items-center gap-3">
            {[3, 6, 9, 12].map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  months === m
                    ? "bg-emerald-600 text-white"
                    : "border border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </label>
        <label className="block">
          <span className="text-sm text-gray-400">Already Saved</span>
          <input
            type="number"
            value={currentSaved}
            onChange={(e) => setCurrentSaved(Number(e.target.value))}
            min={0}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-400">Monthly Savings</span>
          <input
            type="number"
            value={monthlySaving}
            onChange={(e) => setMonthlySaving(Number(e.target.value))}
            min={0}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
        </label>
      </div>

      {/* Results */}
      <div className="mt-6 space-y-4">
        {/* Progress bar */}
        <div>
          <div className="mb-1 flex justify-between text-xs text-gray-400">
            <span>{formatCurrency(currentSaved)} saved</span>
            <span>Target: {formatCurrency(result.target)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${result.pctComplete * 100}%` }}
            />
          </div>
          <p className="mt-1 text-center text-xs text-gray-500">
            {(result.pctComplete * 100).toFixed(0)}% funded
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-700 p-3 text-center">
            <p className="text-xs text-gray-500">Target</p>
            <p className="text-lg font-bold text-emerald-400">
              {formatCurrency(result.target)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-700 p-3 text-center">
            <p className="text-xs text-gray-500">Still Need</p>
            <p className="text-lg font-bold text-amber-400">
              {formatCurrency(result.remaining)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-700 p-3 text-center">
            <p className="text-xs text-gray-500">Time to Goal</p>
            <p className="text-lg font-bold text-white">
              {result.remaining === 0
                ? "Done!"
                : result.monthsToGoal === Infinity
                  ? "—"
                  : `${result.monthsToGoal} mo`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
