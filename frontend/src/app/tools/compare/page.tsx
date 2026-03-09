"use client";

import { useState } from "react";
import TickerInput from "@/components/ui/ticker-input";
import RecommendationPanel from "@/components/ui/recommendation-panel";
import { generateCompareRecommendations } from "@/lib/recommendation-engine";
import { formatCurrency, formatCompact, formatPct } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type CompareData = {
  ticker: string;
  name: string;
  price: number;
  change_pct: number;
  dividend_yield: number | null;
  pe_ratio: number | null;
  market_cap: number | null;
  sector: string;
  beta: number | null;
  type: string;
};

export default function ComparePage() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [data, setData] = useState<CompareData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCompare() {
    if (tickers.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        tickers.map(async (t) => {
          const [quote, fund] = await Promise.all([
            fetch(`${API_BASE}/api/quote/${t}`).then((r) => r.json()),
            fetch(`${API_BASE}/api/fundamentals/${t}`).then((r) => r.json()),
          ]);
          return { ...quote, beta: fund.beta } as CompareData;
        })
      );
      setData(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setLoading(false);
    }
  }

  const metrics = [
    { key: "price", label: "Price", fmt: (v: number) => formatCurrency(v) },
    {
      key: "change_pct",
      label: "Day Change",
      fmt: (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`,
    },
    {
      key: "dividend_yield",
      label: "Div Yield",
      fmt: (v: number | null) => (v ? formatPct(v) : "N/A"),
    },
    {
      key: "pe_ratio",
      label: "P/E Ratio",
      fmt: (v: number | null) => (v ? v.toFixed(1) : "N/A"),
    },
    {
      key: "market_cap",
      label: "Market Cap",
      fmt: (v: number | null) => (v ? formatCompact(v) : "N/A"),
    },
    {
      key: "beta",
      label: "Beta",
      fmt: (v: number | null) => (v ? v.toFixed(2) : "N/A"),
    },
  ] as const;

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-white">Compare</h1>
      <p className="mb-6 text-gray-400">
        Side-by-side comparison of 2-4 tickers.
      </p>

      <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <TickerInput tickers={tickers} onChange={setTickers} max={4} />
        <button
          onClick={handleCompare}
          disabled={tickers.length < 2 || loading}
          className="mt-4 rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-40"
        >
          {loading ? "Comparing..." : "Compare"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {data.length > 0 && (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-400">
                    Metric
                  </th>
                  {data.map((d) => (
                    <th
                      key={d.ticker}
                      className="px-4 py-3 text-right text-xs font-medium uppercase text-white"
                    >
                      {d.ticker}
                      <div className="text-[10px] font-normal text-gray-500">
                        {d.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.key} className="border-t border-gray-800">
                    <td className="px-4 py-2 text-gray-400">{m.label}</td>
                    {data.map((d) => (
                      <td
                        key={d.ticker}
                        className="px-4 py-2 text-right text-gray-300"
                      >
                        {m.fmt(d[m.key] as never)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-gray-800">
                  <td className="px-4 py-2 text-gray-400">Sector</td>
                  {data.map((d) => (
                    <td
                      key={d.ticker}
                      className="px-4 py-2 text-right text-gray-300"
                    >
                      {d.sector}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-gray-800">
                  <td className="px-4 py-2 text-gray-400">Type</td>
                  {data.map((d) => (
                    <td
                      key={d.ticker}
                      className="px-4 py-2 text-right text-gray-300"
                    >
                      {d.type}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <RecommendationPanel
            recommendations={generateCompareRecommendations(data)}
          />
        </>
      )}
    </div>
  );
}
