"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function RetirementCalculator() {
  const [annualExpenses, setAnnualExpenses] = useState<number>(50000);
  const [currentSavings, setCurrentSavings] = useState<number>(100000);
  const [yearsToRetire, setYearsToRetire] = useState<number>(25);
  const [monthlyContrib, setMonthlyContrib] = useState<number>(1000);
  const [returnRate, setReturnRate] = useState<number>(7);
  const [withdrawalRate, setWithdrawalRate] = useState<number>(4);

  const result = useMemo(() => {
    const targetNest = annualExpenses / (withdrawalRate / 100);
    const monthlyRate = returnRate / 100 / 12;
    const totalMonths = yearsToRetire * 12;

    // Project future value with contributions
    let projected = currentSavings;
    for (let m = 0; m < totalMonths; m++) {
      projected = projected * (1 + monthlyRate) + monthlyContrib;
    }

    const gap = targetNest - projected;
    const onTrack = projected >= targetNest;

    // Monthly income from nest egg at withdrawal rate
    const monthlyIncome = (projected * (withdrawalRate / 100)) / 12;

    // How much more per month to close the gap
    let extraNeeded = 0;
    if (!onTrack && totalMonths > 0) {
      // FV of annuity formula: FV = PMT * ((1+r)^n - 1) / r
      const fvFactor =
        monthlyRate > 0
          ? (Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate
          : totalMonths;
      extraNeeded = fvFactor > 0 ? gap / fvFactor : 0;
    }

    return {
      targetNest,
      projected,
      gap,
      onTrack,
      monthlyIncome,
      extraNeeded: Math.max(0, Math.ceil(extraNeeded)),
    };
  }, [
    annualExpenses,
    currentSavings,
    yearsToRetire,
    monthlyContrib,
    returnRate,
    withdrawalRate,
  ]);

  const pctToGoal = Math.min(1, result.projected / result.targetNest);

  return (
    <div className="rounded-xl border border-amber-500/30 bg-gray-900/80 p-6">
      <h3 className="mb-4 text-lg font-semibold text-amber-400">
        Retirement Number Calculator
      </h3>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className="text-sm text-gray-400">
            Annual Expenses in Retirement
          </span>
          <input
            type="number"
            value={annualExpenses}
            onChange={(e) => setAnnualExpenses(Number(e.target.value))}
            min={0}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-400">Current Savings</span>
          <input
            type="number"
            value={currentSavings}
            onChange={(e) => setCurrentSavings(Number(e.target.value))}
            min={0}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-400">Years to Retirement</span>
          <input
            type="number"
            value={yearsToRetire}
            onChange={(e) =>
              setYearsToRetire(Math.min(50, Math.max(1, Number(e.target.value))))
            }
            min={1}
            max={50}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-400">Monthly Contribution</span>
          <input
            type="number"
            value={monthlyContrib}
            onChange={(e) => setMonthlyContrib(Number(e.target.value))}
            min={0}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-400">Expected Return (%)</span>
          <input
            type="number"
            value={returnRate}
            onChange={(e) => setReturnRate(Number(e.target.value))}
            min={0}
            max={20}
            step={0.5}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-400">Withdrawal Rate (%)</span>
          <input
            type="number"
            value={withdrawalRate}
            onChange={(e) => setWithdrawalRate(Number(e.target.value))}
            min={1}
            max={10}
            step={0.5}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
          />
        </label>
      </div>

      {/* Results */}
      <div className="mt-6 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-700 p-3 text-center">
            <p className="text-xs text-gray-500">Your Number</p>
            <p className="text-lg font-bold text-amber-400">
              {formatCurrency(result.targetNest)}
            </p>
            <p className="text-xs text-gray-600">
              at {withdrawalRate}% withdrawal
            </p>
          </div>
          <div className="rounded-lg border border-gray-700 p-3 text-center">
            <p className="text-xs text-gray-500">Projected Savings</p>
            <p
              className={`text-lg font-bold ${result.onTrack ? "text-emerald-400" : "text-red-400"}`}
            >
              {formatCurrency(result.projected)}
            </p>
            <p className="text-xs text-gray-600">in {yearsToRetire} years</p>
          </div>
          <div className="rounded-lg border border-gray-700 p-3 text-center">
            <p className="text-xs text-gray-500">Monthly Income</p>
            <p className="text-lg font-bold text-emerald-400">
              {formatCurrency(result.monthlyIncome)}
            </p>
            <p className="text-xs text-gray-600">from projected savings</p>
          </div>
          <div className="rounded-lg border border-gray-700 p-3 text-center">
            <p className="text-xs text-gray-500">Status</p>
            <p
              className={`text-lg font-bold ${result.onTrack ? "text-emerald-400" : "text-amber-400"}`}
            >
              {result.onTrack ? "On Track" : `+${formatCurrency(result.extraNeeded)}/mo`}
            </p>
            <p className="text-xs text-gray-600">
              {result.onTrack ? "You're set!" : "needed to close gap"}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="mb-1 flex justify-between text-xs text-gray-400">
            <span>Projected: {formatCurrency(result.projected)}</span>
            <span>Target: {formatCurrency(result.targetNest)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                result.onTrack ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${pctToGoal * 100}%` }}
            />
          </div>
        </div>

        {/* Monte Carlo link */}
        <div className="text-center">
          <Link
            href={`/tools/monte-carlo?initial=${currentSavings}&years=${yearsToRetire}&monthly=${monthlyContrib}&withdrawal=${Math.round((result.projected * (withdrawalRate / 100)) / 12)}`}
            className="text-sm text-amber-400 hover:text-amber-300"
          >
            Stress-test this plan with 10,000 market scenarios →
          </Link>
        </div>
      </div>
    </div>
  );
}
