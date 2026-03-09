import EmergencyFundCalculator from "@/components/calculators/emergency-fund-calculator";

export default function NowPage() {
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-white">NOW — Safety Net</h1>
      <p className="mb-6 text-gray-400">
        Before investing a single dollar, build your financial foundation.
      </p>

      <div className="space-y-6">
        <EmergencyFundCalculator />

        <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <h2 className="text-xl font-semibold text-emerald-400">
            Emergency Fund
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Save 3-6 months of living expenses in an accessible account. This
            protects you from unexpected job loss, medical bills, or car
            repairs without touching your investments.
          </p>
          <div className="mt-4 rounded-lg bg-gray-900/50 p-4">
            <p className="text-sm text-gray-300">
              <strong>Rule of thumb:</strong> Monthly expenses x 6 = target
            </p>
            <p className="mt-1 text-xs text-gray-500">
              If you spend $3,000/month, aim for $18,000 in savings.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-xl font-semibold text-white">
            Where to Keep It
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-700 p-4">
              <h3 className="font-medium text-emerald-400">High-Yield Savings</h3>
              <p className="mt-1 text-sm text-gray-400">4.0-5.0% APY</p>
              <p className="mt-1 text-xs text-gray-600">
                FDIC insured, instant access. Best for emergency funds.
              </p>
            </div>
            <div className="rounded-lg border border-gray-700 p-4">
              <h3 className="font-medium text-emerald-400">Money Market</h3>
              <p className="mt-1 text-sm text-gray-400">SPAXX, T-Bill ETFs</p>
              <p className="mt-1 text-xs text-gray-600">
                Slightly higher yield, still very liquid. Good for cash reserves.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-xl font-semibold text-white">Action Plan</h2>
          <ol className="mt-3 space-y-2 text-sm text-gray-400">
            <li>1. Calculate monthly expenses (rent, food, insurance, debt payments)</li>
            <li>2. Set target: expenses x 3 (minimum) to x 6 (comfortable)</li>
            <li>3. Open a high-yield savings account (Fidelity, Marcus, Ally)</li>
            <li>4. Automate monthly transfers until target reached</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
