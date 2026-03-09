"""Pydantic models for API request/response validation."""

from pydantic import BaseModel, Field


# --- Data endpoints ---

class QuoteResponse(BaseModel):
    ticker: str
    name: str
    price: float
    previous_close: float
    change: float
    change_pct: float
    volume: int
    market_cap: int | None = None
    sector: str = "N/A"
    dividend_yield: float | None = None
    pe_ratio: float | None = None
    high_52w: float | None = Field(None, alias="52w_high")
    low_52w: float | None = Field(None, alias="52w_low")
    exchange: str = ""
    type: str = "Stock"


# --- Risk metrics ---

class RiskMetricsRequest(BaseModel):
    tickers: list[str] = Field(..., min_length=1, max_length=20)
    weights: list[float] | None = None
    period: str = "2y"
    risk_free_rate: float = 0.05


class RiskMetricsResponse(BaseModel):
    tickers: list[str]
    weights: list[float]
    sharpe_ratio: float
    sortino_ratio: float
    treynor_ratio: float | None = None
    beta: float | None = None
    alpha: float | None = None
    var_95: float
    cvar_95: float
    max_drawdown: float
    max_drawdown_duration_days: int | None = None
    annualized_return: float
    annualized_volatility: float
    calmar_ratio: float | None = None


# --- Monte Carlo ---

class MonteCarloRequest(BaseModel):
    tickers: list[str] = Field(..., min_length=1, max_length=20)
    weights: list[float] | None = None
    initial_investment: float = 10000
    time_horizon_years: int = Field(5, ge=1, le=30)
    monthly_contribution: float = 0
    monthly_withdrawal: float = 0
    num_simulations: int = Field(10000, ge=1000, le=50000)
    target_value: float | None = None


class MonteCarloResponse(BaseModel):
    percentiles: dict[str, list[float]]  # "5th", "25th", etc.
    expected_final: float
    median_final: float
    worst_case: float
    best_case: float
    prob_target: float | None = None
    prob_loss: float
    months: list[int]


# --- Optimization ---

class OptimizationRequest(BaseModel):
    tickers: list[str] = Field(..., min_length=2, max_length=20)
    period: str = "2y"
    risk_free_rate: float = 0.05
    num_portfolios: int = Field(5000, ge=100, le=20000)


class PortfolioPoint(BaseModel):
    return_val: float = Field(..., alias="return")
    volatility: float
    sharpe: float
    weights: dict[str, float]

    model_config = {"populate_by_name": True}


class OptimizationResponse(BaseModel):
    frontier: list[dict]  # [{return, volatility, sharpe}]
    max_sharpe: PortfolioPoint
    min_volatility: PortfolioPoint
    individual_assets: list[dict]  # [{ticker, return, volatility}]


# --- Dividends ---

class DividendAnalysisRequest(BaseModel):
    ticker: str
    required_return: float = 0.10
    growth_rate: float | None = None


class DividendAnalysisResponse(BaseModel):
    ticker: str
    current_price: float
    dividend_yield: float | None = None
    annual_dividend: float | None = None
    payout_ratio: float | None = None
    sustainability_score: str  # "High", "Medium", "Low"
    ddm_fair_value: float | None = None
    valuation: str  # "Undervalued", "Fair", "Overvalued"
    growth_rates: dict[str, float | None]  # 1yr, 3yr, 5yr, 10yr
    upcoming_ex_date: str | None = None
    history: list[dict]


# --- Portfolio ---

class HoldingInput(BaseModel):
    ticker: str
    shares: float
    cost_basis: float | None = None
    purchase_date: str | None = None


class PortfolioUploadResponse(BaseModel):
    holdings: list[dict]
    total_value: float
    total_cost: float
    total_gain: float
    total_gain_pct: float
    allocation: list[dict]


# --- Screener / Scanner ---

class ScreenerRequest(BaseModel):
    min_dividend_yield: float | None = None
    max_pe_ratio: float | None = None
    min_market_cap: int | None = None
    sector: str | None = None
    security_type: str | None = None  # "Stock", "ETF", "Mutual Fund"
    min_sharpe: float | None = None
    sort_by: str = "dividend_yield"
    limit: int = Field(50, ge=1, le=200)
