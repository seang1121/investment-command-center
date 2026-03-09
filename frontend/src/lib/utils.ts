/** Format a number as currency ($1,234.56) */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format a number as percentage (12.34%) */
export function formatPct(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/** Format large numbers with K/M/B suffixes */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Color for gain/loss values */
export function gainColor(value: number): string {
  if (value > 0) return "text-emerald-500";
  if (value < 0) return "text-red-500";
  return "text-gray-400";
}

/** Background color for gain/loss badges */
export function gainBg(value: number): string {
  if (value > 0) return "bg-emerald-500/10 text-emerald-500";
  if (value < 0) return "bg-red-500/10 text-red-500";
  return "bg-gray-500/10 text-gray-400";
}

/** Risk level to color mapping */
export function riskColor(
  level: "Low" | "Medium" | "High" | string
): string {
  switch (level) {
    case "Low":
      return "text-emerald-500";
    case "Medium":
      return "text-amber-500";
    case "High":
      return "text-red-500";
    default:
      return "text-gray-400";
  }
}
