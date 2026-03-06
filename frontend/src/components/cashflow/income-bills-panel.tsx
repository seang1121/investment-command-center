"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface IncomeSource {
  id: number;
  source: string;
  amount: number;
  frequency: string;
}

interface Bill {
  id: number;
  name: string;
  amount: number;
  due_day: number;
  category: string;
  auto_pay: boolean;
}

interface IncomeBillsPanelProps {
  income: IncomeSource[];
  bills: Bill[];
  onAddIncome: (
    source: string,
    amount: number,
    frequency: string
  ) => Promise<void>;
  onDeleteIncome: (id: number) => Promise<void>;
  onAddBill: (
    name: string,
    amount: number,
    due_day: number,
    category: string,
    auto_pay: boolean
  ) => Promise<void>;
  onDeleteBill: (id: number) => Promise<void>;
}

const FREQUENCIES = ["weekly", "biweekly", "monthly", "annually"];

const BILL_CATEGORIES = [
  "Housing",
  "Transportation",
  "Food & Dining",
  "Utilities",
  "Insurance",
  "Healthcare",
  "Entertainment",
  "Shopping",
  "Subscriptions",
  "Debt Payments",
  "Other",
];

const inputCls =
  "w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none";

const btnCls =
  "rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-40";

export default function IncomeBillsPanel({
  income,
  bills,
  onAddIncome,
  onDeleteIncome,
  onAddBill,
  onDeleteBill,
}: IncomeBillsPanelProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <IncomeSection
        income={income}
        onAdd={onAddIncome}
        onDelete={onDeleteIncome}
      />
      <BillsSection
        bills={bills}
        onAdd={onAddBill}
        onDelete={onDeleteBill}
      />
    </div>
  );
}

/* ---------- Income Panel ---------- */

function IncomeSection({
  income,
  onAdd,
  onDelete,
}: {
  income: IncomeSource[];
  onAdd: IncomeBillsPanelProps["onAddIncome"];
  onDelete: IncomeBillsPanelProps["onDeleteIncome"];
}) {
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    const parsed = parseFloat(amount);
    if (!source.trim() || isNaN(parsed) || parsed <= 0) return;
    setSaving(true);
    try {
      await onAdd(source.trim(), parsed, frequency);
      setSource("");
      setAmount("");
      setFrequency("monthly");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <h2 className="text-xl font-semibold text-white">Income Sources</h2>

      {income.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {income.map((inc) => (
            <li
              key={inc.id}
              className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-white">{inc.source}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {inc.frequency}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-emerald-400">
                  {formatCurrency(inc.amount)}
                </span>
                <button
                  onClick={() => onDelete(inc.id)}
                  className="text-xs text-gray-600 transition-colors hover:text-red-400"
                  aria-label={`Delete ${inc.source}`}
                >
                  &#10005;
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-gray-500">No income sources added.</p>
      )}

      <div className="mt-4 space-y-2">
        <input
          className={inputCls}
          placeholder="Source name"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            className={inputCls}
            placeholder="Amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <select
            className={inputCls}
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <button className={btnCls} onClick={handleAdd} disabled={saving}>
          {saving ? "Adding..." : "Add Income"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Bills Panel ---------- */

function BillsSection({
  bills,
  onAdd,
  onDelete,
}: {
  bills: Bill[];
  onAdd: IncomeBillsPanelProps["onAddBill"];
  onDelete: IncomeBillsPanelProps["onDeleteBill"];
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [category, setCategory] = useState("Other");
  const [autoPay, setAutoPay] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    const parsed = parseFloat(amount);
    const day = parseInt(dueDay, 10);
    if (!name.trim() || isNaN(parsed) || parsed <= 0) return;
    if (isNaN(day) || day < 1 || day > 31) return;
    setSaving(true);
    try {
      await onAdd(name.trim(), parsed, day, category, autoPay);
      setName("");
      setAmount("");
      setDueDay("1");
      setCategory("Other");
      setAutoPay(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <h2 className="text-xl font-semibold text-white">Monthly Bills</h2>

      {bills.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {bills.map((bill) => (
            <li
              key={bill.id}
              className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-white">
                  {bill.name}
                  {bill.auto_pay && (
                    <span className="ml-2 rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-400">
                      Auto-Pay
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  Due day {bill.due_day} &middot; {bill.category}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-red-400">
                  {formatCurrency(bill.amount)}
                </span>
                <button
                  onClick={() => onDelete(bill.id)}
                  className="text-xs text-gray-600 transition-colors hover:text-red-400"
                  aria-label={`Delete ${bill.name}`}
                >
                  &#10005;
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-gray-500">No bills added.</p>
      )}

      <div className="mt-4 space-y-2">
        <input
          className={inputCls}
          placeholder="Bill name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            className={inputCls}
            placeholder="Amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            className={`${inputCls} w-24`}
            placeholder="Day (1-31)"
            type="number"
            min="1"
            max="31"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            className={inputCls}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {BILL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-gray-400">
            <input
              type="checkbox"
              checked={autoPay}
              onChange={(e) => setAutoPay(e.target.checked)}
              className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-emerald-500 focus:ring-emerald-500"
            />
            Auto-Pay
          </label>
        </div>
        <button className={btnCls} onClick={handleAdd} disabled={saving}>
          {saving ? "Adding..." : "Add Bill"}
        </button>
      </div>
    </div>
  );
}
