// Shared TypeScript interfaces matching API schemas

export interface Quote {
  ticker: string;
  name: string;
  price: number;
  previous_close: number;
  change: number;
  change_pct: number;
  volume: number;
  market_cap: number | null;
  sector: string;
  dividend_yield: number | null;
  pe_ratio: number | null;
  "52w_high": number | null;
  "52w_low": number | null;
  exchange: string;
  type: "Stock" | "ETF" | "Mutual Fund";
}

export interface HistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RiskMetricsRequest {
  tickers: string[];
  weights?: number[];
  period?: string;
  risk_free_rate?: number;
}

export interface RiskMetricsResponse {
  tickers: string[];
  weights: number[];
  sharpe_ratio: number;
  sortino_ratio: number;
  treynor_ratio: number | null;
  beta: number | null;
  alpha: number | null;
  var_95: number;
  cvar_95: number;
  max_drawdown: number;
  max_drawdown_duration_days: number | null;
  annualized_return: number;
  annualized_volatility: number;
  calmar_ratio: number | null;
}

export interface MonteCarloRequest {
  tickers: string[];
  weights?: number[];
  initial_investment?: number;
  time_horizon_years?: number;
  monthly_contribution?: number;
  monthly_withdrawal?: number;
  num_simulations?: number;
  target_value?: number;
}

export interface MonteCarloResponse {
  percentiles: Record<string, number[]>;
  expected_final: number;
  median_final: number;
  worst_case: number;
  best_case: number;
  prob_target: number | null;
  prob_loss: number;
  months: number[];
}

export interface OptimizationRequest {
  tickers: string[];
  period?: string;
  risk_free_rate?: number;
  num_portfolios?: number;
}

export interface PortfolioPoint {
  return: number;
  volatility: number;
  sharpe: number;
  weights: Record<string, number>;
}

export interface OptimizationResponse {
  frontier: Array<{ return: number; volatility: number; sharpe: number }>;
  max_sharpe: PortfolioPoint;
  min_volatility: PortfolioPoint;
  individual_assets: Array<{
    ticker: string;
    return: number;
    volatility: number;
  }>;
}

export interface DividendAnalysis {
  ticker: string;
  current_price: number;
  dividend_yield: number | null;
  annual_dividend: number | null;
  payout_ratio: number | null;
  sustainability_score: "High" | "Medium" | "Low";
  ddm_fair_value: number | null;
  valuation: "Undervalued" | "Fair" | "Overvalued";
  growth_rates: Record<string, number | null>;
  upcoming_ex_date: string | null;
  history: Array<{ date: string; amount: number }>;
}

export interface Holding {
  ticker: string;
  shares: number;
  cost_basis: number | null;
  purchase_date: string | null;
}

export interface PortfolioSummary {
  holdings: Array<
    Holding & {
      current_price: number;
      market_value: number;
      gain: number;
      gain_pct: number;
    }
  >;
  total_value: number;
  total_cost: number;
  total_gain: number;
  total_gain_pct: number;
  allocation: Array<{ ticker: string; pct: number }>;
}

/* ── Cash Flow ────────────────────────────────────── */

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
}

export interface IncomeSource {
  id: number;
  name: string;
  amount: number;
  frequency: "weekly" | "biweekly" | "monthly" | "annual";
  created_at: string;
}

export interface Bill {
  id: number;
  name: string;
  amount: number;
  due_day: number;
  category: string;
  is_auto_pay: boolean;
  created_at: string;
}

export interface CashFlowSummary {
  monthly_income: number;
  monthly_expenses: number;
  surplus: number;
  savings_rate: number;
  spending_by_category: Record<string, number>;
  top_expenses: Array<{ description: string; amount: number; category: string }>;
  bills_total: number;
  discretionary_spending: number;
}

/* ── Net Worth ────────────────────────────────────── */

export interface Asset {
  id: number;
  name: string;
  value: number;
  category: string;
  updated_at: string;
}

export interface Liability {
  id: number;
  name: string;
  balance: number;
  category: string;
  interest_rate: number | null;
  min_payment: number | null;
  updated_at: string;
}

export interface NetWorthSummary {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  assets_by_category: Record<string, number>;
  liabilities_by_category: Record<string, number>;
  assets: Asset[];
  liabilities: Liability[];
}

export interface NetWorthSnapshot {
  id: number;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  snapshot_at: string;
}

/* ── Portfolio Health ─────────────────────────────── */

export interface HealthCheck {
  name: string;
  status: "good" | "warning" | "critical";
  message: string;
  detail?: string;
}

export interface PortfolioHealthResponse {
  score: number;
  status: "excellent" | "good" | "fair" | "needs_attention";
  checks: HealthCheck[];
  recommendations: string[];
}
