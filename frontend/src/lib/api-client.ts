const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchApi<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }

  return res.json();
}

// --- Data ---

import type {
  CashFlowSummary,
  DividendAnalysis,
  HistoryPoint,
  IncomeSource,
  Bill,
  MonteCarloRequest,
  MonteCarloResponse,
  NetWorthSummary,
  NetWorthSnapshot,
  Asset,
  Liability,
  OptimizationRequest,
  OptimizationResponse,
  PortfolioHealthResponse,
  PortfolioSummary,
  Quote,
  RiskMetricsRequest,
  RiskMetricsResponse,
  Transaction,
} from "./types";

export async function getQuote(ticker: string): Promise<Quote> {
  return fetchApi(`/api/quote/${ticker}`);
}

export async function getHistory(
  ticker: string,
  period = "2y"
): Promise<HistoryPoint[]> {
  return fetchApi(`/api/history/${ticker}?period=${period}`);
}

export async function getDividends(ticker: string): Promise<DividendAnalysis> {
  return fetchApi(`/api/dividends/${ticker}`);
}

// --- Analysis ---

export async function getRiskMetrics(
  req: RiskMetricsRequest
): Promise<RiskMetricsResponse> {
  return fetchApi("/api/risk-metrics", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function runMonteCarlo(
  req: MonteCarloRequest
): Promise<MonteCarloResponse> {
  return fetchApi("/api/monte-carlo", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function runOptimization(
  req: OptimizationRequest
): Promise<OptimizationResponse> {
  return fetchApi("/api/optimize", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

// --- Portfolio ---

export async function uploadPortfolio(
  file: File
): Promise<PortfolioSummary> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/portfolio/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function getPortfolio(): Promise<PortfolioSummary> {
  return fetchApi("/api/portfolio");
}

// Re-export for use in types import
interface DividendAnalysisRequest {
  ticker: string;
  required_return?: number;
  growth_rate?: number;
}

export async function analyzeDividend(
  req: DividendAnalysisRequest
): Promise<DividendAnalysis> {
  return fetchApi("/api/dividends/analyze", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

// --- Cash Flow ---

export async function uploadBankStatement(
  file: File
): Promise<{ count: number; transactions: Transaction[] }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/cashflow/upload-statement`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function getTransactions(
  months = 3
): Promise<Transaction[]> {
  return fetchApi(`/api/cashflow/transactions?months=${months}`);
}

export async function getCashFlowSummary(
  months = 3
): Promise<CashFlowSummary> {
  return fetchApi(`/api/cashflow/summary?months=${months}`);
}

export async function addIncome(
  data: { name: string; amount: number; frequency: string }
): Promise<IncomeSource> {
  return fetchApi("/api/cashflow/income", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getIncomes(): Promise<IncomeSource[]> {
  return fetchApi("/api/cashflow/income");
}

export async function deleteIncome(id: number): Promise<void> {
  await fetchApi(`/api/cashflow/income/${id}`, { method: "DELETE" });
}

export async function addBill(
  data: { name: string; amount: number; due_day: number; category: string; is_auto_pay: boolean }
): Promise<Bill> {
  return fetchApi("/api/cashflow/bills", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getBills(): Promise<Bill[]> {
  return fetchApi("/api/cashflow/bills");
}

export async function deleteBill(id: number): Promise<void> {
  await fetchApi(`/api/cashflow/bills/${id}`, { method: "DELETE" });
}

// --- Net Worth ---

export async function getNetWorthSummary(): Promise<NetWorthSummary> {
  return fetchApi("/api/net-worth/summary");
}

export async function addAsset(
  data: { name: string; value: number; category: string }
): Promise<Asset> {
  return fetchApi("/api/net-worth/assets", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getAssets(): Promise<Asset[]> {
  return fetchApi("/api/net-worth/assets");
}

export async function deleteAsset(id: number): Promise<void> {
  await fetchApi(`/api/net-worth/assets/${id}`, { method: "DELETE" });
}

export async function addLiability(
  data: { name: string; balance: number; category: string; interest_rate?: number; min_payment?: number }
): Promise<Liability> {
  return fetchApi("/api/net-worth/liabilities", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getLiabilities(): Promise<Liability[]> {
  return fetchApi("/api/net-worth/liabilities");
}

export async function deleteLiability(id: number): Promise<void> {
  await fetchApi(`/api/net-worth/liabilities/${id}`, { method: "DELETE" });
}

export async function saveNetWorthSnapshot(): Promise<NetWorthSnapshot> {
  return fetchApi("/api/net-worth/snapshot", { method: "POST" });
}

export async function getNetWorthHistory(
  months = 12
): Promise<NetWorthSnapshot[]> {
  return fetchApi(`/api/net-worth/history?months=${months}`);
}

// --- Portfolio Health ---

export async function getPortfolioHealth(): Promise<PortfolioHealthResponse> {
  return fetchApi("/api/portfolio/health");
}
