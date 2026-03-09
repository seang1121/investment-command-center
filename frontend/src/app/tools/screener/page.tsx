"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { formatCurrency, formatCompact, formatPct, gainBg } from "@/lib/utils";
import RecommendationPanel from "@/components/ui/recommendation-panel";
import { generateScreenerRecommendations } from "@/lib/recommendation-engine";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type ScanResult = {
  ticker: string;
  name: string;
  price: number;
  change_pct: number;
  sector: string;
  type: string;
  market_cap: number | null;
  pe_ratio: number | null;
  dividend_yield: number | null;
  score: number;
  signal: string;
  reasons: string[];
  payout_ratio?: number | null;
  ex_date?: string | null;
  revenue_growth?: number | null;
  profit_margin?: number | null;
};

type ScanType = "dividends" | "tech" | "mutual-funds" | "hysa" | "hidden-gems";

const signalColors: Record<string, string> = {
  "Strong Buy": "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  Buy: "bg-green-500/20 text-green-400 border-green-500/40",
  Hold: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  Watch: "bg-gray-500/20 text-gray-400 border-gray-500/40",
};

const VALID_SCAN_TYPES: ScanType[] = ["dividends", "tech", "mutual-funds", "hysa", "hidden-gems"];

export default function ScreenerPage() {
  return (
    <Suspense>
      <ScreenerContent />
    </Suspense>
  );
}

function ScreenerContent() {
  const searchParams = useSearchParams();
  const [scanType, setScanType] = useState<ScanType>("dividends");
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get("type");
    if (t && VALID_SCAN_TYPES.includes(t as ScanType)) {
      setScanType(t as ScanType);
    }
  }, [searchParams]);

  async function runScan() {
    setLoading(true);
    setError(null);
    try {
      const endpointMap: Record<ScanType, string> = {
        dividends: "/api/scanner/dividends",
        tech: "/api/scanner/tech",
        "mutual-funds": "/api/scanner/mutual-funds",
        hysa: "/api/scanner/hysa",
        "hidden-gems": "/api/scanner/hidden-gems",
      };
      const endpoint = endpointMap[scanType];

      const res = await fetch(`${API_BASE}${endpoint}`);
      if (!res.ok) throw new Error("Scan failed");
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-white">
        Scanner & Screener
      </h1>
      <p className="mb-6 text-gray-400">
        AI-powered stock scanner with buy/hold/sell signals. Choose a scan type
        to analyze.
      </p>

      {/* Scan Type Selection */}
      <div className="mb-6 flex gap-3">
        {[
          {
            id: "dividends" as const,
            label: "Dividend Stalwarts",
            desc: "High-yield income stocks a CFP would recommend",
            color: "amber",
          },
          {
            id: "tech" as const,
            label: "Emerging Tech",
            desc: "AI, data centers, semiconductors, innovation",
            color: "violet",
          },
          {
            id: "mutual-funds" as const,
            label: "Mutual Funds",
            desc: "Top index and actively managed funds",
            color: "blue",
          },
          {
            id: "hysa" as const,
            label: "Cash & Savings",
            desc: "HYSA alternatives \u2014 T-bill & money market ETFs",
            color: "emerald",
          },
          {
            id: "hidden-gems" as const,
            label: "Hidden Gems",
            desc: "Undervalued small/mid-cap stocks with dividends",
            color: "rose",
          },
        ].map((scan) => (
          <button
            key={scan.id}
            onClick={() => setScanType(scan.id)}
            className={`flex-1 rounded-xl border p-4 text-left transition-all ${
              scanType === scan.id
                ? `border-${scan.color}-500/60 bg-${scan.color}-500/10`
                : "border-gray-800 hover:border-gray-700"
            }`}
          >
            <p
              className={`font-semibold ${
                scanType === scan.id ? "text-white" : "text-gray-300"
              }`}
            >
              {scan.label}
            </p>
            <p className="text-xs text-gray-500">{scan.desc}</p>
          </button>
        ))}
      </div>

      <button
        onClick={runScan}
        disabled={loading}
        className="mb-6 rounded-lg bg-rose-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-500 disabled:opacity-40"
      >
        {loading ? "Scanning market..." : "Run Scanner"}
      </button>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <>
          <div className="space-y-3">
            {results.map((r) => (
              <div
                key={r.ticker}
                className="rounded-xl border border-gray-800 bg-gray-900/50 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-white">
                        {r.ticker}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          signalColors[r.signal] || signalColors.Watch
                        }`}
                      >
                        {r.signal}
                      </span>
                      <span className="text-xs text-gray-600">
                        Score: {r.score}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{r.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-medium text-white">
                      {formatCurrency(r.price)}
                    </p>
                    <span
                      className={`text-xs ${gainBg(r.change_pct)} rounded px-1.5 py-0.5`}
                    >
                      {r.change_pct >= 0 ? "+" : ""}
                      {r.change_pct.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                  {r.dividend_yield != null && (
                    <span>Yield: {formatPct(r.dividend_yield)}</span>
                  )}
                  {r.pe_ratio != null && (
                    <span>P/E: {r.pe_ratio.toFixed(1)}</span>
                  )}
                  {r.market_cap != null && (
                    <span>MCap: {formatCompact(r.market_cap)}</span>
                  )}
                  <span>{r.sector}</span>
                  <span>{r.type}</span>
                  {r.payout_ratio != null && (
                    <span>Payout: {formatPct(r.payout_ratio)}</span>
                  )}
                  {r.revenue_growth != null && (
                    <span>Rev Growth: {formatPct(r.revenue_growth)}</span>
                  )}
                </div>

                {r.reasons.length > 0 && (
                  <div className="mt-2">
                    {r.reasons.map((reason, i) => (
                      <span
                        key={i}
                        className="mr-2 inline-block rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <RecommendationPanel
            recommendations={generateScreenerRecommendations(results, scanType)}
          />
        </>
      )}
    </div>
  );
}
