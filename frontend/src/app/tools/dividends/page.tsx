"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { analyzeDividend } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import SmartMetricCard from "@/components/ui/smart-metric-card";
import MetricCard from "@/components/ui/metric-card";
import RecommendationPanel from "@/components/ui/recommendation-panel";
import { generateDividendRecommendations } from "@/lib/recommendation-engine";
import type { DividendAnalysis } from "@/lib/types";
import { formatCurrency, formatPct } from "@/lib/utils";

export default function DividendsPage() {
  return (
    <Suspense>
      <DividendsContent />
    </Suspense>
  );
}

function DividendsContent() {
  const searchParams = useSearchParams();
  const [ticker, setTicker] = useState("");

  useEffect(() => {
    const t = searchParams.get("ticker");
    if (t) setTicker(t.toUpperCase());
  }, [searchParams]);
  const { data, loading, error, execute } = useApi(analyzeDividend);

  async function handleAnalyze() {
    if (!ticker.trim()) return;
    await execute({ ticker: ticker.toUpperCase() });
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-white">
        Dividend Analysis
      </h1>
      <p className="mb-6 text-gray-400">
        DDM valuation, payout sustainability, growth rates, and dividend
        calendar for any ticker.
      </p>

      <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={ticker}
            onChange={(e) =>
              setTicker(e.target.value.replace(/[^a-zA-Z.]/g, ""))
            }
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder="Enter ticker (e.g. SCHD, VZ, T)"
            className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-amber-500 focus:outline-none"
            maxLength={10}
          />
          <button
            onClick={handleAnalyze}
            disabled={!ticker.trim() || loading}
            className="rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-40"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {data && <DividendResults data={data} />}
    </div>
  );
}

function DividendResults({ data }: { data: DividendAnalysis }) {
  const sustainColor =
    data.sustainability_score === "High"
      ? "green"
      : data.sustainability_score === "Medium"
        ? "amber"
        : "red";

  const valColor =
    data.valuation === "Undervalued"
      ? "green"
      : data.valuation === "Overvalued"
        ? "red"
        : "amber";

  const recommendations = generateDividendRecommendations(data);

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-white">
        {data.ticker}
      </h2>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Current Price"
          value={formatCurrency(data.current_price)}
        />
        <SmartMetricCard
          metricKey="dividend_yield"
          value={data.dividend_yield}
          rawLabel="Dividend Yield"
          rawValue={data.dividend_yield ? formatPct(data.dividend_yield) : "N/A"}
          color="amber"
        />
        <MetricCard
          label="Annual Dividend"
          value={
            data.annual_dividend
              ? formatCurrency(data.annual_dividend)
              : "N/A"
          }
          color="amber"
        />
        <SmartMetricCard
          metricKey="payout_ratio"
          value={data.payout_ratio}
          rawLabel="Payout Ratio"
          rawValue={data.payout_ratio ? formatPct(data.payout_ratio) : "N/A"}
          subtitle="< 60% is healthy"
          color={
            data.payout_ratio
              ? data.payout_ratio < 0.6
                ? "green"
                : "red"
              : "default"
          }
        />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Sustainability"
          value={data.sustainability_score}
          color={sustainColor as "green" | "amber" | "red"}
        />
        <MetricCard
          label="DDM Fair Value"
          value={
            data.ddm_fair_value
              ? formatCurrency(data.ddm_fair_value)
              : "N/A"
          }
          subtitle={data.ddm_fair_value ? `vs ${formatCurrency(data.current_price)} market` : "No dividend data"}
          color={valColor as "green" | "amber" | "red"}
        />
        <MetricCard
          label="Valuation"
          value={data.valuation}
          color={valColor as "green" | "amber" | "red"}
        />
      </div>

      {/* Growth Rates */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Dividend Growth Rates (CAGR)
        </h3>
        <div className="grid gap-3 sm:grid-cols-4">
          {Object.entries(data.growth_rates).map(([period, rate]) => (
            <MetricCard
              key={period}
              label={period.toUpperCase()}
              value={rate !== null ? formatPct(rate) : "N/A"}
              color={rate !== null && rate > 0 ? "green" : "red"}
            />
          ))}
        </div>
      </div>

      {/* Upcoming Ex-Date */}
      {data.upcoming_ex_date && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-sm text-amber-400">
            Next ex-dividend date:{" "}
            <span className="font-semibold">{data.upcoming_ex_date}</span>
          </p>
        </div>
      )}

      {/* Recent History */}
      {data.history.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Recent Dividend Payments
          </h3>
          <div className="overflow-hidden rounded-lg border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-400">Date</th>
                  <th className="px-4 py-2 text-right text-gray-400">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.history
                  .slice(-10)
                  .reverse()
                  .map((h) => (
                    <tr key={h.date} className="border-t border-gray-800">
                      <td className="px-4 py-2 text-gray-300">{h.date}</td>
                      <td className="px-4 py-2 text-right text-emerald-400">
                        ${h.amount.toFixed(4)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <RecommendationPanel recommendations={recommendations} />
    </div>
  );
}
