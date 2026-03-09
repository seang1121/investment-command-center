"use client";

import { useCallback, useEffect, useState } from "react";
import MetricCard from "@/components/ui/metric-card";
import FileUpload from "@/components/ui/file-upload";
import SpendingChart from "@/components/cashflow/spending-chart";
import TransactionTable from "@/components/cashflow/transaction-table";
import IncomeBillsPanel from "@/components/cashflow/income-bills-panel";
import { formatCurrency } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
}

interface CashFlowSummary {
  monthly_income: number;
  monthly_expenses: number;
  monthly_surplus: number;
  savings_rate: number;
  spending_by_category: Record<string, number>;
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

function savingsRateColor(rate: number): "green" | "amber" | "red" {
  if (rate >= 20) return "green";
  if (rate >= 10) return "amber";
  return "red";
}

export default function CashFlowPage() {
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);
  const [income, setIncome] = useState<IncomeSource[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [inc, bl, txn, sum] = await Promise.all([
        api<IncomeSource[]>("/api/cashflow/income"),
        api<Bill[]>("/api/cashflow/bills"),
        api<Transaction[]>("/api/cashflow/transactions?limit=50"),
        api<CashFlowSummary>("/api/cashflow/summary"),
      ]);
      setIncome(inc);
      setBills(bl);
      setTransactions(txn);
      setSummary(sum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadMsg(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/api/cashflow/upload-statement`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || "Upload failed");
      }
      const data = await res.json();
      setUploadMsg(`Imported ${data.count ?? 0} transactions.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleAddIncome(
    source: string,
    amount: number,
    frequency: string
  ) {
    await api("/api/cashflow/income", {
      method: "POST",
      body: JSON.stringify({ source, amount, frequency }),
    });
    await loadData();
  }

  async function handleDeleteIncome(id: number) {
    await api(`/api/cashflow/income/${id}`, { method: "DELETE" });
    await loadData();
  }

  async function handleAddBill(
    name: string,
    amount: number,
    due_day: number,
    category: string,
    auto_pay: boolean
  ) {
    await api("/api/cashflow/bills", {
      method: "POST",
      body: JSON.stringify({ name, amount, due_day, category, auto_pay }),
    });
    await loadData();
  }

  async function handleDeleteBill(id: number) {
    await api(`/api/cashflow/bills/${id}`, { method: "DELETE" });
    await loadData();
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-white">Cash Flow</h1>
      <p className="mb-6 text-gray-400">
        Track income, expenses, and spending patterns to optimize your budget.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Monthly Income"
            value={formatCurrency(summary.monthly_income)}
            color="green"
          />
          <MetricCard
            label="Monthly Expenses"
            value={formatCurrency(summary.monthly_expenses)}
            color="red"
          />
          <MetricCard
            label="Monthly Surplus"
            value={formatCurrency(summary.monthly_surplus)}
            color={summary.monthly_surplus >= 0 ? "green" : "red"}
          />
          <MetricCard
            label="Savings Rate"
            value={`${summary.savings_rate.toFixed(1)}%`}
            color={savingsRateColor(summary.savings_rate)}
          />
        </div>
      )}

      {/* Upload Bank Statement */}
      <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h2 className="mb-3 text-xl font-semibold text-white">
          Upload Bank Statement
        </h2>
        <FileUpload
          onFile={handleUpload}
          accept=".csv"
          loading={uploading}
        />
        {uploadMsg && (
          <p className="mt-3 text-sm text-emerald-400">{uploadMsg}</p>
        )}
      </div>

      {/* Income & Bills */}
      <div className="mb-6">
        <IncomeBillsPanel
          income={income}
          bills={bills}
          onAddIncome={handleAddIncome}
          onDeleteIncome={handleDeleteIncome}
          onAddBill={handleAddBill}
          onDeleteBill={handleDeleteBill}
        />
      </div>

      {/* Spending Breakdown & Transactions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">
            Spending Breakdown
          </h2>
          <SpendingChart data={summary?.spending_by_category ?? {}} />
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
          <div className="px-6 pt-6">
            <h2 className="mb-4 text-xl font-semibold text-white">
              Recent Transactions
            </h2>
          </div>
          <TransactionTable transactions={transactions} />
        </div>
      </div>
    </div>
  );
}
