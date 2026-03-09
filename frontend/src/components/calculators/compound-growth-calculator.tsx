"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";

type YearData = {
  year: number;
  balance: number;
  contributions: number;
  interest: number;
};

export default function CompoundGrowthCalculator() {
  const [initial, setInitial] = useState<number>(10000);
  const [monthly, setMonthly] = useState<number>(500);
  const [years, setYears] = useState<number>(10);
  const [rate, setRate] = useState<number>(8);

  const result = useMemo(() => {
    const monthlyRate = rate / 100 / 12;
    const totalMonths = years * 12;
    const yearlyData: YearData[] = [];

    let balance = initial;
    let totalContributions = initial;

    for (let y = 1; y <= years; y++) {
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + monthlyRate) + monthly;
        totalContributions += monthly;
      }
      yearlyData.push({
        year: y,
        balance,
        contributions: totalContributions,
        interest: balance - totalContributions,
      });
    }

    const finalBalance = balance;
    const totalInterest = finalBalance - totalContributions;

    return { finalBalance, totalContributions, totalInterest, yearlyData };
  }, [initial, monthly, years, rate]);

  const maxBalance =
    result.yearlyData.length > 0
      ? result.yearlyData[result.yearlyData.length - 1].balance
      : 1;

  return (
    <div className="rounded-xl border border-violet-500/30 bg-gray-900/80 p-6">
      <h3 className="mb-4 text-lg font-semibold text-violet-400">
        Compound Growth Calculator
      </h3>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="text-sm text-gray-400">Starting Amount</span>
          <input
            type="number"
            value={initial}
            onChange={(e) => setInitial(Number(e.target.value))}
            min={0}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-400">Monthly Contribution</span>
          <input
            type="number"
            value={monthly}
            onChange={(e) => setMonthly(Number(e.target.value))}
            min={0}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-400">Years</span>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Math.min(50, Math.max(1, Number(e.target.value))))}
            min={1}
            max={50}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-400">Annual Return (%)</span>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            min={0}
            max={30}
            step={0.5}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
          />
        </label>
      </div>

      {/* Summary */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-700 p-3 text-center">
          <p className="text-xs text-gray-500">Total Contributions</p>
          <p className="text-lg font-bold text-blue-400">
            {formatCurrency(result.totalContributions)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-700 p-3 text-center">
          <p className="text-xs text-gray-500">Interest Earned</p>
          <p className="text-lg font-bold text-emerald-400">
            {formatCurrency(result.totalInterest)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-700 p-3 text-center">
          <p className="text-xs text-gray-500">Final Balance</p>
          <p className="text-lg font-bold text-violet-400">
            {formatCurrency(result.finalBalance)}
          </p>
        </div>
      </div>

      {/* Growth chart — pure CSS stacked bars */}
      <div className="mt-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
          Growth Over Time
        </p>
        <div className="flex items-end gap-1" style={{ height: 160 }}>
          {result.yearlyData.map((d) => {
            const totalH = (d.balance / maxBalance) * 100;
            const contribH = (d.contributions / maxBalance) * 100;

            return (
              <div
                key={d.year}
                className="group relative flex-1"
                style={{ height: "100%" }}
              >
                {/* Interest portion */}
                <div
                  className="absolute bottom-0 w-full rounded-t bg-emerald-500/60 transition-all"
                  style={{ height: `${totalH}%` }}
                />
                {/* Contributions portion */}
                <div
                  className="absolute bottom-0 w-full rounded-t bg-blue-500/60 transition-all"
                  style={{ height: `${contribH}%` }}
                />
                {/* Tooltip */}
                <div className="absolute -top-14 left-1/2 z-10 hidden -translate-x-1/2 rounded bg-gray-800 px-2 py-1 text-xs text-white shadow group-hover:block">
                  <p>Year {d.year}</p>
                  <p className="text-violet-300">
                    {formatCurrency(d.balance)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-xs text-gray-600">
          <span>Year 1</span>
          <span>Year {years}</span>
        </div>
        <div className="mt-2 flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-blue-500/60" />{" "}
            Contributions
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-emerald-500/60" />{" "}
            Interest
          </span>
        </div>
      </div>
    </div>
  );
}
