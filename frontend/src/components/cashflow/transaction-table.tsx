"use client";

import { formatCurrency } from "@/lib/utils";

interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

const BADGE_COLORS: Record<string, string> = {
  Housing: "bg-blue-500/10 text-blue-400",
  Transportation: "bg-violet-500/10 text-violet-400",
  "Food & Dining": "bg-amber-500/10 text-amber-400",
  Utilities: "bg-cyan-500/10 text-cyan-400",
  Insurance: "bg-indigo-500/10 text-indigo-400",
  Healthcare: "bg-rose-500/10 text-rose-400",
  Entertainment: "bg-pink-500/10 text-pink-400",
  Shopping: "bg-orange-500/10 text-orange-400",
  Subscriptions: "bg-teal-500/10 text-teal-400",
  "Debt Payments": "bg-red-500/10 text-red-400",
  Income: "bg-emerald-500/10 text-emerald-400",
  Other: "bg-gray-500/10 text-gray-400",
};

function getBadgeColor(category: string): string {
  return BADGE_COLORS[category] || "bg-gray-500/10 text-gray-400";
}

export default function TransactionTable({
  transactions,
}: TransactionTableProps) {
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (sorted.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">
        No transactions yet. Upload a bank statement to get started.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-900">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-400">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-400">
              Description
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-400">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-400">
              Category
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((txn) => (
            <tr key={txn.id} className="border-t border-gray-800">
              <td className="whitespace-nowrap px-4 py-3 text-gray-400">
                {txn.date}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-gray-300">
                {txn.description}
              </td>
              <td
                className={`whitespace-nowrap px-4 py-3 text-right font-medium ${
                  txn.amount >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {txn.amount >= 0 ? "+" : ""}
                {formatCurrency(Math.abs(txn.amount))}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${getBadgeColor(txn.category)}`}
                >
                  {txn.category}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
