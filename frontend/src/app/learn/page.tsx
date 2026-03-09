import Link from "next/link";

const PHASES = [
  {
    href: "/learn/now",
    label: "NOW",
    title: "Build Your Safety Net",
    desc: "Emergency fund, high-yield savings, money market accounts. The foundation everything else depends on.",
    color: "emerald",
    items: ["3-6 month emergency fund", "High-yield savings (4.5-5% APY)", "Money market: SPAXX, T-Bill ETFs"],
  },
  {
    href: "/learn/then",
    label: "THEN",
    title: "Short-Term Goals (6mo - 2yr)",
    desc: "CD ladders, I-Bonds, short-term bond ETFs for goals you can see on the horizon.",
    color: "blue",
    items: ["CD Ladder strategy", "I-Bonds (inflation-protected)", "Short-term bond ETFs"],
  },
  {
    href: "/learn/later",
    label: "LATER",
    title: "Build Wealth (2-10yr)",
    desc: "Where the real growth happens. Index funds, dividend reinvestment, sector exposure.",
    color: "violet",
    items: ["6 investment strategies", "Dollar-cost averaging", "Risk-adjusted portfolios"],
  },
  {
    href: "/learn/retirement",
    label: "RETIRE",
    title: "Long-Term Planning (10+yr)",
    desc: "401k, IRA, Roth — maximize tax-advantaged growth and plan for sustainable withdrawal.",
    color: "amber",
    items: ["Tax-deferred accounts", "Sequence-of-returns risk", "Withdrawal strategies"],
  },
];

const colorMap: Record<string, string> = {
  emerald: "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60",
  blue: "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60",
  violet: "border-violet-500/30 bg-violet-500/5 hover:border-violet-500/60",
  amber: "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60",
};

const labelMap: Record<string, string> = {
  emerald: "text-emerald-400",
  blue: "text-blue-400",
  violet: "text-violet-400",
  amber: "text-amber-400",
};

export default function LearnPage() {
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-white">
        Investment Roadmap
      </h1>
      <p className="mb-8 text-gray-400">
        A phased approach to building wealth — from emergency savings to
        retirement. Each phase builds on the last.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        {PHASES.map((phase) => (
          <Link
            key={phase.href}
            href={phase.href}
            className={`group rounded-xl border p-6 transition-all ${colorMap[phase.color]}`}
          >
            <span
              className={`text-xs font-bold uppercase tracking-widest ${labelMap[phase.color]}`}
            >
              {phase.label}
            </span>
            <h3 className="mt-1 text-xl font-semibold text-white">
              {phase.title}
            </h3>
            <p className="mt-2 text-sm text-gray-500 group-hover:text-gray-400">
              {phase.desc}
            </p>
            <ul className="mt-3 space-y-1">
              {phase.items.map((item) => (
                <li key={item} className="text-xs text-gray-600">
                  &#8226; {item}
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
    </div>
  );
}
