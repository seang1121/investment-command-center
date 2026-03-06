"use client";

import { useCallback, useEffect, useState } from "react";
import { SummaryCard, ItemList, BarSection } from "./components";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ASSET_CATS = [
  "Cash & Savings",
  "Investments",
  "Real Estate",
  "Vehicles",
  "Personal Property",
  "Other",
];
const LIABILITY_CATS = [
  "Mortgage",
  "Student Loans",
  "Auto Loans",
  "Credit Cards",
  "Personal Loans",
  "Medical Debt",
  "Other",
];

interface Asset {
  id: number;
  name: string;
  value: number;
  category: string;
}
interface Liability {
  id: number;
  name: string;
  balance: number;
  category: string;
  interest_rate: number;
  min_payment: number;
}
interface Summary {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  assets_by_category: Record<string, number>;
  liabilities_by_category: Record<string, number>;
  assets: Asset[];
  liabilities: Liability[];
}

const card = "rounded-xl border border-gray-800 bg-gray-900/50 p-6";

export default function NetWorthPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  // Asset form
  const [aName, setAName] = useState("");
  const [aValue, setAValue] = useState("");
  const [aCat, setACat] = useState(ASSET_CATS[0]);

  // Liability form
  const [lName, setLName] = useState("");
  const [lBal, setLBal] = useState("");
  const [lCat, setLCat] = useState(LIABILITY_CATS[0]);
  const [lRate, setLRate] = useState("");
  const [lMin, setLMin] = useState("");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/net-worth/summary`);
      if (res.ok) setSummary(await res.json());
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addAsset() {
    if (!aName || !aValue) return;
    await fetch(`${API}/api/net-worth/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: aName,
        value: parseFloat(aValue),
        category: aCat,
      }),
    });
    setAName("");
    setAValue("");
    refresh();
  }

  async function addLiability() {
    if (!lName || !lBal) return;
    await fetch(`${API}/api/net-worth/liabilities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: lName,
        balance: parseFloat(lBal),
        category: lCat,
        interest_rate: parseFloat(lRate) || 0,
        min_payment: parseFloat(lMin) || 0,
      }),
    });
    setLName("");
    setLBal("");
    setLRate("");
    setLMin("");
    refresh();
  }

  async function delAsset(id: number) {
    await fetch(`${API}/api/net-worth/assets/${id}`, { method: "DELETE" });
    refresh();
  }

  async function delLiability(id: number) {
    await fetch(`${API}/api/net-worth/liabilities/${id}`, {
      method: "DELETE",
    });
    refresh();
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  const totA = summary?.total_assets ?? 0;
  const totL = summary?.total_liabilities ?? 0;
  const nw = summary?.net_worth ?? 0;
  const assets = summary?.assets ?? [];
  const liabs = summary?.liabilities ?? [];
  const aByCat = summary?.assets_by_category ?? {};
  const lByCat = summary?.liabilities_by_category ?? {};

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Net Worth Tracker</h1>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Assets" value={totA} color="emerald" />
        <SummaryCard label="Total Liabilities" value={totL} color="red" />
        <SummaryCard
          label="Net Worth"
          value={nw}
          color={nw >= 0 ? "emerald" : "red"}
        />
      </div>

      {/* Breakdown bars */}
      {(Object.keys(aByCat).length > 0 ||
        Object.keys(lByCat).length > 0) && (
        <div className={card}>
          <h2 className="mb-4 text-lg font-semibold text-white">Breakdown</h2>
          <BarSection
            title="Assets"
            data={aByCat}
            total={totA}
            color="emerald"
          />
          <BarSection
            title="Liabilities"
            data={lByCat}
            total={totL}
            color="red"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assets */}
        <div className={card}>
          <h2 className="mb-4 text-lg font-semibold text-emerald-400">
            Assets
          </h2>
          <ItemList
            items={assets.map((a) => ({
              id: a.id,
              name: a.name,
              amount: a.value,
              badge: a.category,
            }))}
            onDelete={delAsset}
            color="emerald"
          />
          <div className="mt-4 space-y-2 border-t border-gray-800 pt-4">
            <p className="text-sm font-medium text-gray-400">Add Asset</p>
            <div className="flex flex-wrap gap-2">
              <input
                placeholder="Name"
                value={aName}
                onChange={(e) => setAName(e.target.value)}
                className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
              />
              <input
                placeholder="Value"
                type="number"
                value={aValue}
                onChange={(e) => setAValue(e.target.value)}
                className="w-28 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
              />
              <select
                value={aCat}
                onChange={(e) => setACat(e.target.value)}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
              >
                {ASSET_CATS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <button
                onClick={addAsset}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Liabilities */}
        <div className={card}>
          <h2 className="mb-4 text-lg font-semibold text-red-400">
            Liabilities
          </h2>
          <ItemList
            items={liabs.map((l) => ({
              id: l.id,
              name: l.name,
              amount: l.balance,
              badge: l.category,
              extra: `${l.interest_rate}% APR`,
            }))}
            onDelete={delLiability}
            color="red"
          />
          <div className="mt-4 space-y-2 border-t border-gray-800 pt-4">
            <p className="text-sm font-medium text-gray-400">Add Liability</p>
            <div className="flex flex-wrap gap-2">
              <input
                placeholder="Name"
                value={lName}
                onChange={(e) => setLName(e.target.value)}
                className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
              />
              <input
                placeholder="Balance"
                type="number"
                value={lBal}
                onChange={(e) => setLBal(e.target.value)}
                className="w-28 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
              />
              <select
                value={lCat}
                onChange={(e) => setLCat(e.target.value)}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
              >
                {LIABILITY_CATS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input
                placeholder="APR %"
                type="number"
                value={lRate}
                onChange={(e) => setLRate(e.target.value)}
                className="w-20 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
              />
              <input
                placeholder="Min pmt"
                type="number"
                value={lMin}
                onChange={(e) => setLMin(e.target.value)}
                className="w-24 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
              />
              <button
                onClick={addLiability}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
