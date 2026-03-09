"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { runMonteCarlo } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import TickerInput from "@/components/ui/ticker-input";
import SmartMetricCard from "@/components/ui/smart-metric-card";
import MetricCard from "@/components/ui/metric-card";
import MonteCarloChart from "@/components/charts/monte-carlo-chart";
import RecommendationPanel from "@/components/ui/recommendation-panel";
import { generateMonteCarloRecommendations } from "@/lib/recommendation-engine";
import type { MonteCarloRequest } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function MonteCarloPage() {
  return (
    <Suspense>
      <MonteCarloContent />
    </Suspense>
  );
}

function MonteCarloContent() {
  const searchParams = useSearchParams();
  const [tickers, setTickers] = useState<string[]>([]);
  const [initial, setInitial] = useState(10000);
  const [years, setYears] = useState(5);
  const [monthly, setMonthly] = useState(500);
  const [withdrawal, setWithdrawal] = useState(0);
  const [target, setTarget] = useState<number | "">("");

  useEffect(() => {
    const t = searchParams.get("tickers");
    if (t) setTickers(t.split(",").filter(Boolean));
    const i = searchParams.get("initial");
    if (i) setInitial(Number(i));
    const y = searchParams.get("years");
    if (y) setYears(Number(y));
    const m = searchParams.get("monthly");
    if (m) setMonthly(Number(m));
    const w = searchParams.get("withdrawal");
    if (w) setWithdrawal(Number(w));
    const tgt = searchParams.get("target");
    if (tgt) setTarget(Number(tgt));
  }, [searchParams]);

  const { data, loading, error, execute } = useApi(runMonteCarlo);

  const params: MonteCarloRequest = {
    tickers,
    initial_investment: initial,
    time_horizon_years: years,
    monthly_contribution: monthly,
    monthly_withdrawal: withdrawal,
    target_value: target || undefined,
    num_simulations: 10000,
  };

  async function handleRun() {
    if (tickers.length === 0) return;
    await execute(params);
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-white">
        Monte Carlo Simulation
      </h1>
      <p className="mb-6 text-gray-400">
        Run 10,000 scenarios to see the range of possible outcomes for your
        portfolio.
      </p>

      <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <TickerInput tickers={tickers} onChange={setTickers} />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="text-sm text-gray-400">Initial Investment</span>
            <input
              type="number"
              value={initial}
              onChange={(e) => setInitial(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">Time Horizon (years)</span>
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              min={1}
              max={30}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">Monthly Contribution</span>
            <input
              type="number"
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">
              Monthly Withdrawal (retirement)
            </span>
            <input
              type="number"
              value={withdrawal}
              onChange={(e) => setWithdrawal(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">
              Target Value (optional)
            </span>
            <input
              type="number"
              value={target}
              onChange={(e) =>
                setTarget(e.target.value ? Number(e.target.value) : "")
              }
              placeholder="e.g. 100000"
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-emerald-500 focus:outline-none"
            />
          </label>
        </div>

        <button
          onClick={handleRun}
          disabled={tickers.length === 0 || loading}
          className="mt-4 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
        >
          {loading ? "Running 10,000 simulations..." : "Run Simulation"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {data && (
        <div>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Expected Value"
              value={formatCurrency(data.expected_final)}
              color="green"
            />
            <MetricCard
              label="Median Value"
              value={formatCurrency(data.median_final)}
              color="blue"
            />
            <MetricCard
              label="Worst Case (5th pct)"
              value={formatCurrency(data.worst_case)}
              color="red"
            />
            <MetricCard
              label="Best Case (95th pct)"
              value={formatCurrency(data.best_case)}
              color="green"
            />
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <SmartMetricCard
              metricKey="prob_loss"
              value={data.prob_loss / 100}
              rawLabel="Probability of Loss"
              rawValue={`${data.prob_loss}%`}
              color={data.prob_loss > 30 ? "red" : "amber"}
            />
            {data.prob_target !== null && (
              <SmartMetricCard
                metricKey="prob_target"
                value={data.prob_target / 100}
                rawLabel="Probability of Target"
                rawValue={`${data.prob_target}%`}
                color={data.prob_target > 50 ? "green" : "amber"}
              />
            )}
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <MonteCarloChart data={data} />
          </div>

          <RecommendationPanel
            recommendations={generateMonteCarloRecommendations(
              { ...data, prob_loss: data.prob_loss / 100, prob_target: data.prob_target !== null ? data.prob_target / 100 : null },
              params,
            )}
          />
        </div>
      )}
    </div>
  );
}
