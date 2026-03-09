interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  color?: "green" | "red" | "amber" | "blue" | "default";
}

const colorMap = {
  green: "border-emerald-500/30 bg-emerald-500/5",
  red: "border-red-500/30 bg-red-500/5",
  amber: "border-amber-500/30 bg-amber-500/5",
  blue: "border-blue-500/30 bg-blue-500/5",
  default: "border-gray-800 bg-gray-900/50",
};

const textMap = {
  green: "text-emerald-400",
  red: "text-red-400",
  amber: "text-amber-400",
  blue: "text-blue-400",
  default: "text-white",
};

export default function MetricCard({
  label,
  value,
  subtitle,
  color = "default",
}: MetricCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${colorMap[color]}`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${textMap[color]}`}>{value}</p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
      )}
    </div>
  );
}
