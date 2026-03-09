"use client";

import { useCallback, useEffect, useState } from "react";
import { getPortfolio, uploadPortfolio } from "@/lib/api-client";
import FileUpload from "@/components/ui/file-upload";
import MetricCard from "@/components/ui/metric-card";
import { formatCurrency, gainBg } from "@/lib/utils";
import type { PortfolioSummary } from "@/lib/types";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPortfolio = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPortfolio();
      setPortfolio(data);
    } catch {
      // No portfolio yet — that's fine
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const data = await uploadPortfolio(file);
      setPortfolio(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-white">My Portfolio</h1>
      <p className="mb-6 text-gray-400">
        Upload your holdings to track performance, P&L, and dividends.
      </p>

      {(!portfolio || portfolio.holdings.length === 0) && (
        <div className="mb-6">
          <FileUpload onFile={handleUpload} loading={uploading} />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center text-gray-500">Loading portfolio...</div>
      )}

      {portfolio && portfolio.holdings.length > 0 && (
        <div>
          {/* Summary Cards */}
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Total Value"
              value={formatCurrency(portfolio.total_value)}
              color="blue"
            />
            <MetricCard
              label="Total Cost"
              value={formatCurrency(portfolio.total_cost)}
            />
            <MetricCard
              label="Total Gain/Loss"
              value={formatCurrency(portfolio.total_gain)}
              subtitle={`${portfolio.total_gain_pct.toFixed(2)}%`}
              color={portfolio.total_gain >= 0 ? "green" : "red"}
            />
            <MetricCard
              label="Holdings"
              value={`${portfolio.holdings.length}`}
            />
          </div>

          {/* Holdings Table */}
          <div className="mb-6 overflow-hidden rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-400">
                    Ticker
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-400">
                    Shares
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-400">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-400">
                    Value
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-400">
                    Cost Basis
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-400">
                    Gain/Loss
                  </th>
                </tr>
              </thead>
              <tbody>
                {portfolio.holdings.map((h) => (
                  <tr key={h.ticker} className="border-t border-gray-800">
                    <td className="px-4 py-3 font-medium text-white">
                      {h.ticker}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      {h.shares}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      {formatCurrency(h.current_price)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      {formatCurrency(h.market_value)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      {h.cost_basis
                        ? formatCurrency(h.cost_basis)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${gainBg(h.gain)}`}>
                        {h.gain >= 0 ? "+" : ""}
                        {formatCurrency(h.gain)} ({h.gain_pct.toFixed(1)}%)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Allocation */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Allocation
            </h3>
            <div className="space-y-2">
              {portfolio.allocation.map((a) => (
                <div key={a.ticker} className="flex items-center gap-3">
                  <span className="w-14 text-xs font-medium text-gray-300">
                    {a.ticker}
                  </span>
                  <div className="flex-1 rounded-full bg-gray-800">
                    <div
                      className="h-3 rounded-full bg-emerald-500/60"
                      style={{ width: `${a.pct}%` }}
                    />
                  </div>
                  <span className="w-14 text-right text-xs text-gray-400">
                    {a.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Re-upload */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <p className="mb-2 text-sm text-gray-400">
              Update portfolio by uploading a new file:
            </p>
            <FileUpload onFile={handleUpload} loading={uploading} />
          </div>
        </div>
      )}
    </div>
  );
}
