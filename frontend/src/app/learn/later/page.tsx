import Link from "next/link";
import CompoundGrowthCalculator from "@/components/calculators/compound-growth-calculator";

export default function LaterPage() {
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-white">
        LATER — Build Wealth
      </h1>
      <p className="mb-6 text-gray-400">
        For money you won&apos;t need for 2-10 years. This is where real growth
        happens.
      </p>

      <div className="space-y-6">
        <CompoundGrowthCalculator />

        <section className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-6">
          <h2 className="text-xl font-semibold text-violet-400">
            Core Principles
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-400">
            <li>
              <strong className="text-white">Diversify:</strong> Never put all
              eggs in one basket. Spread across sectors, geographies, and asset
              types.
            </li>
            <li>
              <strong className="text-white">Dollar-Cost Average:</strong>{" "}
              Invest a fixed amount monthly regardless of market conditions.
              Reduces timing risk.
            </li>
            <li>
              <strong className="text-white">Rebalance Quarterly:</strong> When
              allocations drift &gt;5% from targets, rebalance back.
            </li>
            <li>
              <strong className="text-white">Keep Costs Low:</strong> Favor
              index funds and ETFs with expense ratios under 0.20%.
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">
            Use Our Tools
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/tools/efficient-frontier"
              className="rounded-lg border border-violet-500/30 p-4 transition-colors hover:bg-violet-500/5"
            >
              <h3 className="font-medium text-violet-400">
                Efficient Frontier
              </h3>
              <p className="text-xs text-gray-500">
                Find optimal portfolio weights for your tickers
              </p>
            </Link>
            <Link
              href="/tools/monte-carlo"
              className="rounded-lg border border-blue-500/30 p-4 transition-colors hover:bg-blue-500/5"
            >
              <h3 className="font-medium text-blue-400">Monte Carlo</h3>
              <p className="text-xs text-gray-500">
                See 10,000 possible outcomes for your investment plan
              </p>
            </Link>
            <Link
              href="/tools/dividends"
              className="rounded-lg border border-amber-500/30 p-4 transition-colors hover:bg-amber-500/5"
            >
              <h3 className="font-medium text-amber-400">Dividends</h3>
              <p className="text-xs text-gray-500">
                Analyze dividend stocks for income and growth
              </p>
            </Link>
            <Link
              href="/tools/screener"
              className="rounded-lg border border-rose-500/30 p-4 transition-colors hover:bg-rose-500/5"
            >
              <h3 className="font-medium text-rose-400">Scanner</h3>
              <p className="text-xs text-gray-500">
                Find dividend stalwarts and emerging tech picks
              </p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
