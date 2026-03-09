"use client";

export type GoalType = "risk" | "grow" | "income" | "find" | "health";

interface GoalCardsProps {
  onSelect: (goal: GoalType) => void;
}

const GOALS: {
  id: GoalType;
  icon: string;
  label: string;
  subtitle: string;
}[] = [
  {
    id: "risk",
    icon: "\u{1F6E1}\u{FE0F}",
    label: "Understand my risk",
    subtitle: "Sharpe ratio, drawdown, volatility analysis",
  },
  {
    id: "grow",
    icon: "\u{1F4C8}",
    label: "Grow my money",
    subtitle: "Monte Carlo projections & growth modeling",
  },
  {
    id: "income",
    icon: "\u{1F4B0}",
    label: "Earn dividend income",
    subtitle: "Yield analysis & dividend sustainability",
  },
  {
    id: "find",
    icon: "\u{1F50D}",
    label: "Find investments",
    subtitle: "Scan for dividend or tech opportunities",
  },
  {
    id: "health",
    icon: "\u{2764}\u{FE0F}",
    label: "Check portfolio health",
    subtitle: "Overall portfolio review & diagnostics",
  },
];

export default function GoalCards({ onSelect }: GoalCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {GOALS.map((goal) => (
        <button
          key={goal.id}
          onClick={() => onSelect(goal.id)}
          className="group rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-left transition-all hover:border-emerald-500/50 hover:bg-gray-800/50"
        >
          <span className="text-2xl">{goal.icon}</span>
          <p className="mt-2 font-medium text-white group-hover:text-emerald-400">
            {goal.label}
          </p>
          <p className="mt-1 text-xs text-gray-500">{goal.subtitle}</p>
        </button>
      ))}
    </div>
  );
}
