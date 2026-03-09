"use client";

export default function ReportsPage() {
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-white">Reports</h1>
      <p className="mb-6 text-gray-400">
        Generate on-demand portfolio performance reports.
      </p>

      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-8 text-center">
        <p className="text-lg text-gray-500">
          Upload a portfolio first to generate reports.
        </p>
        <a
          href="/portfolio"
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
        >
          Go to Portfolio
        </a>
      </div>
    </div>
  );
}
