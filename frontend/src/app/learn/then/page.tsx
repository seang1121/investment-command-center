import Link from "next/link";

export default function ThenPage() {
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-white">
        THEN — Short-Term Goals
      </h1>
      <p className="mb-6 text-gray-400">
        For money you need in 6 months to 2 years. Preserve capital while
        beating inflation.
      </p>

      <div className="space-y-6">
        <section className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-6">
          <h2 className="text-xl font-semibold text-blue-400">CD Ladders</h2>
          <p className="mt-2 text-sm text-gray-400">
            Split your money across CDs with staggered maturity dates (3, 6, 9,
            12 months). As each CD matures, reinvest at the longest term for
            the best rate while maintaining regular access.
          </p>
        </section>

        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-xl font-semibold text-white">I-Bonds</h2>
          <p className="mt-2 text-sm text-gray-400">
            US Treasury inflation-protected bonds. Rates adjust with CPI. $10K
            annual purchase limit. 1-year lockup, penalty-free after 5 years.
          </p>
        </section>

        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-xl font-semibold text-white">
            Short-Term Bond ETFs
          </h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-400">ETF</th>
                  <th className="px-4 py-2 text-right text-gray-400">Yield</th>
                  <th className="px-4 py-2 text-right text-gray-400">Duration</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { ticker: "BIL", yield: "~5.0%", duration: "< 3 mo" },
                  { ticker: "SHV", yield: "~4.8%", duration: "< 1 yr" },
                  { ticker: "SCHO", yield: "~4.5%", duration: "1-3 yr" },
                  { ticker: "BSV", yield: "~4.3%", duration: "1-5 yr" },
                ].map((row) => (
                  <tr key={row.ticker} className="border-t border-gray-700">
                    <td className="px-4 py-2 font-medium text-white">
                      {row.ticker}
                    </td>
                    <td className="px-4 py-2 text-right text-emerald-400">
                      {row.yield}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-400">
                      {row.duration}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="text-center">
          <Link
            href="/tools/risk-metrics"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Analyze any of these with our Risk Metrics tool →
          </Link>
        </div>
      </div>
    </div>
  );
}
