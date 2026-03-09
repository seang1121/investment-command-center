import Link from "next/link";
import RetirementCalculator from "@/components/calculators/retirement-calculator";

export default function RetirementPage() {
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-white">
        RETIRE — Long-Term Planning
      </h1>
      <p className="mb-6 text-gray-400">
        For money with a 10+ year horizon. Maximize tax-advantaged growth and
        plan for sustainable withdrawal.
      </p>

      <div className="space-y-6">
        <RetirementCalculator />

        <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
          <h2 className="text-xl font-semibold text-amber-400">
            Tax-Advantaged Accounts
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-700 p-4">
              <h3 className="font-medium text-white">401(k)</h3>
              <p className="mt-1 text-sm text-amber-400">$23,500 limit (2025)</p>
              <p className="mt-1 text-xs text-gray-500">
                Pre-tax contributions. Employer match = free money. Always
                contribute at least enough to get the full match.
              </p>
            </div>
            <div className="rounded-lg border border-gray-700 p-4">
              <h3 className="font-medium text-white">Roth IRA</h3>
              <p className="mt-1 text-sm text-amber-400">$7,000 limit (2025)</p>
              <p className="mt-1 text-xs text-gray-500">
                After-tax contributions, but grows and withdraws tax-free.
                Best if you expect higher taxes in retirement.
              </p>
            </div>
            <div className="rounded-lg border border-gray-700 p-4">
              <h3 className="font-medium text-white">Traditional IRA</h3>
              <p className="mt-1 text-sm text-amber-400">$7,000 limit (2025)</p>
              <p className="mt-1 text-xs text-gray-500">
                Tax-deductible contributions. Taxed on withdrawal. Best if
                you expect lower taxes in retirement.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-xl font-semibold text-white">
            The 4% Rule (and Its Limits)
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Withdraw 4% of your portfolio in year 1, then adjust for inflation
            each year. Historically provides 30 years of income with 95%
            success rate.
          </p>
          <div className="mt-3 rounded-lg bg-gray-800 p-3">
            <p className="text-sm text-gray-300">
              <strong>Need $50K/year?</strong> You need $50,000 / 0.04 ={" "}
              <span className="text-amber-400">$1,250,000</span> saved.
            </p>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Use our Monte Carlo tool to simulate your specific withdrawal plan
            with 10,000 market scenarios.
          </p>
        </section>

        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-xl font-semibold text-white">
            Sequence-of-Returns Risk
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Bad returns early in retirement hurt far more than bad returns later.
            A 30% drop in year 1 of retirement is devastating; the same drop in
            year 20 is manageable. This is why a bucket strategy (cash + bonds +
            growth) protects early years.
          </p>
        </section>

        <div className="text-center">
          <Link
            href="/tools/monte-carlo"
            className="rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-500"
          >
            Simulate Your Retirement Plan →
          </Link>
        </div>
      </div>
    </div>
  );
}
