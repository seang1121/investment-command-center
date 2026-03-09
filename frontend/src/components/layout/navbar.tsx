"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePreferences } from "@/contexts/preferences-context";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/cash-flow", label: "Cash Flow" },
  { href: "/net-worth", label: "Net Worth" },
  { href: "/portfolio", label: "Portfolio" },
  {
    label: "Tools",
    children: [
      { href: "/tools/risk-metrics", label: "Risk Metrics" },
      { href: "/tools/monte-carlo", label: "Monte Carlo" },
      { href: "/tools/efficient-frontier", label: "Efficient Frontier" },
      { href: "/tools/dividends", label: "Dividends" },
      { href: "/tools/screener", label: "Screener" },
      { href: "/tools/compare", label: "Compare" },
    ],
  },
  { href: "/learn", label: "Learn" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { preferences, setMode } = usePreferences();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 font-bold text-gray-950">
            IC
          </div>
          <span className="hidden text-lg font-semibold text-white sm:block">
            Investment Command Center
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) =>
            "children" in item && item.children ? (
              <div key={item.label} className="group relative">
                <button className="rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white">
                  {item.label}
                </button>
                <div className="invisible absolute left-0 top-full mt-1 min-w-48 rounded-lg border border-gray-800 bg-gray-950 p-1 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                        pathname === child.href
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  pathname === item.href
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            )
          )}

          {/* Simple / Advanced toggle */}
          <div className="ml-3 flex items-center rounded-lg border border-gray-700 bg-gray-900 p-0.5">
            <button
              onClick={() => setMode("simple")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                preferences.mode === "simple"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Simple
            </button>
            <button
              onClick={() => setMode("advanced")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                preferences.mode === "advanced"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Advanced
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
