"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import GuidedWizard from "@/components/wizard/guided-wizard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const card = "rounded-xl border border-gray-800 bg-gray-900/50 p-6";

const MONEY_LINKS = [
  {
    href: "/cash-flow",
    label: "Cash Flow",
    desc: "Income, expenses, surplus tracking",
    color: "emerald",
  },
  {
    href: "/net-worth",
    label: "Net Worth",
    desc: "Assets, liabilities, snapshots",
    color: "blue",
  },
  {
    href: "/portfolio",
    label: "Portfolio",
    desc: "Holdings, P&L, dividend calendar",
    color: "cyan",
  },
];

const TOOL_LINKS = [
  { href: "/tools/risk-metrics", label: "Risk Metrics", color: "emerald" },
  { href: "/tools/monte-carlo", label: "Monte Carlo", color: "blue" },
  {
    href: "/tools/efficient-frontier",
    label: "Efficient Frontier",
    color: "violet",
  },
  { href: "/tools/dividends", label: "Dividends", color: "amber" },
  { href: "/tools/screener", label: "Screener", color: "rose" },
  { href: "/tools/compare", label: "Compare", color: "cyan" },
];

const colorBorder: Record<string, string> = {
  emerald: "border-emerald-500/30 hover:border-emerald-500/60",
  blue: "border-blue-500/30 hover:border-blue-500/60",
  violet: "border-violet-500/30 hover:border-violet-500/60",
  amber: "border-amber-500/30 hover:border-amber-500/60",
  rose: "border-rose-500/30 hover:border-rose-500/60",
  cyan: "border-cyan-500/30 hover:border-cyan-500/60",
};

const colorText: Record<string, string> = {
  emerald: "text-emerald-400",
  blue: "text-blue-400",
  violet: "text-violet-400",
  amber: "text-amber-400",
  rose: "text-rose-400",
  cyan: "text-cyan-400",
};

interface QuickStats {
  netWorth: number | null;
  surplus: number | null;
  portfolioValue: number | null;
  savingsRate: number | null;
}

export default function Home() {
  const [stats, setStats] = useState<QuickStats>({
    netWorth: null,
    surplus: null,
    portfolioValue: null,
    savingsRate: null,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const s: QuickStats = {
        netWorth: null,
        surplus: null,
        portfolioValue: null,
        savingsRate: null,
      };

      const [nwRes, cfRes, pRes] = await Promise.all([
        fetch(`${API}/api/net-worth/summary`).catch(() => null),
        fetch(`${API}/api/cashflow/summary`).catch(() => null),
        fetch(`${API}/api/portfolio`).catch(() => null),
      ]);

      if (nwRes?.ok) {
        const nw = await nwRes.json();
        if (nw.total_assets > 0 || nw.total_liabilities > 0) {
          s.netWorth = nw.net_worth;
        }
      }
      if (cfRes?.ok) {
        const cf = await cfRes.json();
        if (cf.total_income > 0) {
          s.surplus = (cf.total_income ?? 0) - (cf.total_expenses ?? 0);
          const income = cf.total_income ?? 0;
          if (income > 0 && s.surplus !== null) {
            s.savingsRate = (s.surplus / income) * 100;
          }
        }
      }
      if (pRes?.ok) {
        const p = await pRes.json();
        if (p.total_value > 0) {
          s.portfolioValue = p.total_value;
        }
      }

      setStats(s);
      setLoaded(true);
    }

    load();
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Your Financial Command Center
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-400">
          Track cash flow, net worth, and portfolio performance in one place.
        </p>
      </section>

      {/* Guided Wizard */}
      <section>
        <GuidedWizard />
      </section>

      {/* Row 1: Quick stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Net Worth"
          value={stats.netWorth}
          href="/net-worth"
          loaded={loaded}
          color="emerald"
        />
        <StatCard
          label="Monthly Surplus"
          value={stats.surplus}
          href="/cash-flow"
          loaded={loaded}
          color="blue"
        />
        <StatCard
          label="Portfolio Value"
          value={stats.portfolioValue}
          href="/portfolio"
          loaded={loaded}
          color="cyan"
        />
        <StatCard
          label="Savings Rate"
          value={stats.savingsRate}
          href="/cash-flow"
          loaded={loaded}
          color="violet"
          suffix="%"
        />
      </section>

      {/* Row 2: Two columns */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Your Money */}
        <div className={card}>
          <h2 className="mb-4 text-lg font-semibold text-white">
            Your Money
          </h2>
          <div className="space-y-2">
            {MONEY_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-lg border p-4 transition-all hover:bg-gray-800/50 ${colorBorder[item.color]}`}
              >
                <div>
                  <p className={`font-medium ${colorText[item.color]}`}>
                    {item.label}
                  </p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <span className="text-gray-600">&rarr;</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Analysis Tools */}
        <div className={card}>
          <h2 className="mb-4 text-lg font-semibold text-white">
            Analysis Tools
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {TOOL_LINKS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className={`rounded-lg border p-3 text-center text-sm font-medium transition-all hover:bg-gray-800/50 ${colorBorder[tool.color]} ${colorText[tool.color]}`}
              >
                {tool.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Row 3: Investment Roadmap */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">
          Investment Roadmap
        </h2>
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            {
              href: "/learn/now",
              label: "NOW",
              desc: "Emergency fund",
              bg: "bg-emerald-500/10 border-emerald-500/20",
            },
            {
              href: "/learn/then",
              label: "THEN",
              desc: "Short-term goals",
              bg: "bg-blue-500/10 border-blue-500/20",
            },
            {
              href: "/learn/later",
              label: "LATER",
              desc: "Wealth building",
              bg: "bg-violet-500/10 border-violet-500/20",
            },
            {
              href: "/learn/retirement",
              label: "RETIRE",
              desc: "Long-term planning",
              bg: "bg-amber-500/10 border-amber-500/20",
            },
          ].map((phase) => (
            <Link
              key={phase.href}
              href={phase.href}
              className={`rounded-xl border p-4 text-center transition-all hover:scale-[1.02] ${phase.bg}`}
            >
              <p className="text-lg font-bold text-white">{phase.label}</p>
              <p className="text-xs text-gray-500">{phase.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---- Sub-component ---- */

function StatCard({
  label,
  value,
  href,
  loaded,
  color,
  suffix,
}: {
  label: string;
  value: number | null;
  href: string;
  loaded: boolean;
  color: string;
  suffix?: string;
}) {
  const border = colorBorder[color] ?? "";
  const text = colorText[color] ?? "text-white";

  return (
    <Link
      href={href}
      className={`rounded-xl border bg-gray-900/50 p-5 transition-all hover:bg-gray-800/50 ${border}`}
    >
      <p className="text-sm text-gray-400">{label}</p>
      {!loaded ? (
        <div className="mt-2 h-7 w-24 animate-pulse rounded bg-gray-800" />
      ) : value !== null ? (
        <p className={`mt-1 text-2xl font-bold ${text}`}>
          {suffix === "%"
            ? `${value.toFixed(1)}%`
            : formatCurrency(value)}
        </p>
      ) : (
        <p className="mt-1 text-sm text-gray-500">Set up &rarr;</p>
      )}
    </Link>
  );
}
