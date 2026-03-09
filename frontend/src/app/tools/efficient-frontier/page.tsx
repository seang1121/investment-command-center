"use client";

import { useState } from "react";
import { runOptimization } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import TickerInput from "@/components/ui/ticker-input";
import MetricCard from "@/components/ui/metric-card";
import EfficientFrontierChart from "@/components/charts/efficient-frontier-chart";
import RecommendationPanel from "@/components/ui/recommendation-panel";
import { generateOptimizationRecommendations } from "@/lib/recommendation-engine";
import { formatPct } from "@/lib/utils";

export default function EfficientFrontierPage() {
  const [tickers, setTickers] = useState<string[]>([]);
  const { data, loading, error, execute } = useApi(runOptimization);

  async function handleOptimize() {
    if (tickers.length < 2) return;
    await execute({ tickers });
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-white">
        Efficient Frontier
      </h1>
      <p className="mb-6 text-gray-400">
        Find optimal portfolio weights using Modern Portfolio Theory. Add 2+
        tickers to visualize the risk-return tradeoff.
      </p>

      <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <TickerInput tickers={tickers} onChange={setTickers} />
        <button
          onClick={handleOptimize}
          disabled={tickers.length < 2 || loading}
          className="mt-4 rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-40"
        >
          {loading ? "Optimizing..." : "Optimize Portfolio"}
        </button>
        {tickers.length === 1 && (
          <p className="mt-2 text-xs text-amber-400">
            Add at least 2 tickers to enable optimization.
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {data && (
        <div>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            {/* Max Sharpe */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-400">
                Max Sharpe Portfolio
              </h3>
              <div className="mb-3 grid grid-cols-3 gap-2">
                <MetricCard
                  label="Return"
                  value={formatPct(data.max_sharpe.return)}
                  color="green"
                />
                <MetricCard
                  label="Volatility"
                  value={formatPct(data.max_sharpe.volatility)}
                  color="amber"
                />
                <MetricCard
                  label="Sharpe"
                  value={data.max_sharpe.sharpe.toFixed(2)}
                  color="green"
                />
              </div>
              <WeightsTable weights={data.max_sharpe.weights} />
            </div>

            {/* Min Volatility */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-400">
                Min Volatility Portfolio
              </h3>
              <div className="mb-3 grid grid-cols-3 gap-2">
                <MetricCard
                  label="Return"
                  value={formatPct(data.min_volatility.return)}
                  color="blue"
                />
                <MetricCard
                  label="Volatility"
                  value={formatPct(data.min_volatility.volatility)}
                  color="blue"
                />
                <MetricCard
                  label="Sharpe"
                  value={data.min_volatility.sharpe.toFixed(2)}
                  color="blue"
                />
              </div>
              <WeightsTable weights={data.min_volatility.weights} />
            </div>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <EfficientFrontierChart data={data} />
          </div>

          <RecommendationPanel
            recommendations={generateOptimizationRecommendations(data)}
          />
        </div>
      )}
    </div>
  );
}

function WeightsTable({ weights }: { weights: Record<string, number> }) {
  const sorted = Object.entries(weights)
    .filter(([, v]) => v > 0.001)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-1">
      {sorted.map(([ticker, weight]) => (
        <div key={ticker} className="flex items-center gap-2">
          <span className="w-16 text-xs font-medium text-gray-300">
            {ticker}
          </span>
          <div className="flex-1">
            <div
              className="h-2 rounded-full bg-emerald-500/40"
              style={{ width: `${weight * 100}%` }}
            />
          </div>
          <span className="w-12 text-right text-xs text-gray-400">
            {(weight * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}
