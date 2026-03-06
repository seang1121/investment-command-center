import { formatCurrency } from "@/lib/utils";

export function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const border =
    color === "emerald" ? "border-emerald-500/30" : "border-red-500/30";
  const text = color === "emerald" ? "text-emerald-400" : "text-red-400";
  return (
    <div
      className={`rounded-xl border ${border} bg-gray-900/50 p-6 text-center`}
    >
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${text}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

export function ItemList({
  items,
  onDelete,
  color,
}: {
  items: {
    id: number;
    name: string;
    amount: number;
    badge: string;
    extra?: string;
  }[];
  onDelete: (id: number) => void;
  color: string;
}) {
  const badgeBg =
    color === "emerald"
      ? "bg-emerald-500/10 text-emerald-400"
      : "bg-red-500/10 text-red-400";

  if (!items.length) {
    return (
      <p className="text-sm text-gray-500">No items yet. Add one below.</p>
    );
  }

  return (
    <ul className="max-h-64 space-y-2 overflow-y-auto">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-white">{item.name}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${badgeBg}`}
            >
              {item.badge}
            </span>
            {item.extra && (
              <span className="text-xs text-gray-500">{item.extra}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-white">
              {formatCurrency(item.amount)}
            </span>
            <button
              onClick={() => onDelete(item.id)}
              className="text-xs text-gray-500 hover:text-red-400"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function BarSection({
  title,
  data,
  total,
  color,
}: {
  title: string;
  data: Record<string, number>;
  total: number;
  color: string;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return null;
  const barBg = color === "emerald" ? "bg-emerald-500" : "bg-red-500";

  return (
    <div className="mb-4">
      <p className="mb-2 text-sm font-medium text-gray-400">{title}</p>
      <div className="space-y-1">
        {entries.map(([cat, val]) => {
          const pct = total > 0 ? (val / total) * 100 : 0;
          return (
            <div key={cat} className="flex items-center gap-2">
              <span className="w-32 truncate text-xs text-gray-400">
                {cat}
              </span>
              <div className="flex-1 rounded-full bg-gray-800">
                <div
                  className={`h-2 rounded-full ${barBg}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-20 text-right text-xs text-gray-400">
                {formatCurrency(val)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
