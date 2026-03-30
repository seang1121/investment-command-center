"""API endpoint tests — status codes, schema validation, error handling."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------

class TestHealthEndpoint:
    def test_health_returns_200(self, client: TestClient):
        resp = client.get("/api/health")
        assert resp.status_code == 200

    def test_health_response_shape(self, client: TestClient):
        data = client.get("/api/health").json()
        assert data["status"] == "ok"
        assert "version" in data


# ---------------------------------------------------------------------------
# Data router — /api/quote, /api/history, /api/dividends, /api/fundamentals
# ---------------------------------------------------------------------------

class TestDataRouter:
    def test_quote_success(self, client: TestClient, mock_quote):
        with patch("api.routers.data.get_quote", return_value=mock_quote):
            resp = client.get("/api/quote/AAPL")
        assert resp.status_code == 200
        data = resp.json()
        assert data["ticker"] == "AAPL"
        assert isinstance(data["price"], float)

    def test_quote_not_found(self, client: TestClient):
        with patch("api.routers.data.get_quote", side_effect=ValueError("bad")):
            resp = client.get("/api/quote/ZZZZZZ")
        assert resp.status_code == 404

    def test_history_success(self, client: TestClient, mock_history):
        with patch("api.routers.data.get_history", return_value=mock_history):
            resp = client.get("/api/history/AAPL")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "close" in data[0]
        assert "date" in data[0]

    def test_history_not_found(self, client: TestClient):
        with patch("api.routers.data.get_history", side_effect=ValueError("bad")):
            resp = client.get("/api/history/ZZZZZZ")
        assert resp.status_code == 404

    def test_dividends_success(self, client: TestClient, mock_dividend_info):
        with patch("api.routers.data.get_dividend_info", return_value=mock_dividend_info):
            resp = client.get("/api/dividends/AAPL")
        assert resp.status_code == 200
        data = resp.json()
        assert data["ticker"] == "AAPL"

    def test_fundamentals_success(self, client: TestClient):
        mock_fund = {"ticker": "AAPL", "name": "Apple", "sector": "Technology"}
        with patch("api.routers.data.get_fundamentals", return_value=mock_fund):
            resp = client.get("/api/fundamentals/AAPL")
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Risk metrics — POST /api/risk-metrics
# ---------------------------------------------------------------------------

class TestRiskMetricsRouter:
    def _mock_result(self):
        return {
            "tickers": ["AAPL"],
            "weights": [1.0],
            "sharpe_ratio": 1.25,
            "sortino_ratio": 1.80,
            "treynor_ratio": 0.15,
            "beta": 1.1,
            "alpha": 0.03,
            "var_95": -0.25,
            "cvar_95": -0.35,
            "max_drawdown": -0.18,
            "max_drawdown_duration_days": 45,
            "annualized_return": 0.12,
            "annualized_volatility": 0.20,
            "calmar_ratio": 0.67,
        }

    def test_risk_metrics_success(self, client: TestClient):
        with patch("api.routers.risk_metrics.compute_risk_metrics", return_value=self._mock_result()):
            resp = client.post("/api/risk-metrics", json={"tickers": ["AAPL"]})
        assert resp.status_code == 200
        data = resp.json()
        assert "sharpe_ratio" in data
        assert "var_95" in data
        assert isinstance(data["weights"], list)

    def test_risk_metrics_bad_input(self, client: TestClient):
        resp = client.post("/api/risk-metrics", json={"tickers": []})
        assert resp.status_code == 422

    def test_risk_metrics_value_error(self, client: TestClient):
        with patch("api.routers.risk_metrics.compute_risk_metrics", side_effect=ValueError("Insufficient data")):
            resp = client.post("/api/risk-metrics", json={"tickers": ["AAPL"]})
        assert resp.status_code == 400

    def test_risk_metrics_internal_error(self, client: TestClient):
        with patch("api.routers.risk_metrics.compute_risk_metrics", side_effect=RuntimeError("boom")):
            resp = client.post("/api/risk-metrics", json={"tickers": ["AAPL"]})
        assert resp.status_code == 500


# ---------------------------------------------------------------------------
# Monte Carlo — POST /api/monte-carlo
# ---------------------------------------------------------------------------

class TestMonteCarloRouter:
    def _mock_result(self):
        months = list(range(61))
        return {
            "percentiles": {
                "5th": [10000.0] * 61,
                "25th": [10000.0] * 61,
                "50th": [10000.0] * 61,
                "75th": [10000.0] * 61,
                "95th": [10000.0] * 61,
                "mean": [10000.0] * 61,
            },
            "months": months,
            "expected_final": 15000.0,
            "median_final": 14500.0,
            "worst_case": 8000.0,
            "best_case": 25000.0,
            "prob_loss": 12.5,
            "prob_target": None,
        }

    def test_monte_carlo_success(self, client: TestClient):
        with patch("api.routers.monte_carlo.run_simulation", return_value=self._mock_result()):
            resp = client.post(
                "/api/monte-carlo",
                json={"tickers": ["AAPL", "MSFT"], "time_horizon_years": 5},
            )
        assert resp.status_code == 200
        data = resp.json()
        assert "percentiles" in data
        assert "expected_final" in data
        assert isinstance(data["months"], list)

    def test_monte_carlo_validation_error(self, client: TestClient):
        resp = client.post(
            "/api/monte-carlo",
            json={"tickers": ["AAPL"], "time_horizon_years": -1},
        )
        assert resp.status_code == 422

    def test_monte_carlo_service_error(self, client: TestClient):
        with patch("api.routers.monte_carlo.run_simulation", side_effect=ValueError("data issue")):
            resp = client.post(
                "/api/monte-carlo",
                json={"tickers": ["AAPL"]},
            )
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Optimization — POST /api/optimize
# ---------------------------------------------------------------------------

class TestOptimizationRouter:
    def _mock_result(self):
        return {
            "frontier": [
                {"return": 0.12, "volatility": 0.18, "sharpe": 0.38},
            ],
            "max_sharpe": {
                "return": 0.15,
                "volatility": 0.20,
                "sharpe": 0.50,
                "weights": {"AAPL": 0.6, "MSFT": 0.4},
            },
            "min_volatility": {
                "return": 0.10,
                "volatility": 0.12,
                "sharpe": 0.42,
                "weights": {"AAPL": 0.3, "MSFT": 0.7},
            },
            "individual_assets": [
                {"ticker": "AAPL", "return": 0.14, "volatility": 0.22},
                {"ticker": "MSFT", "return": 0.12, "volatility": 0.18},
            ],
        }

    def test_optimize_success(self, client: TestClient):
        with patch("api.routers.optimization.optimize_portfolio", return_value=self._mock_result()):
            resp = client.post("/api/optimize", json={"tickers": ["AAPL", "MSFT"]})
        assert resp.status_code == 200
        data = resp.json()
        assert "frontier" in data
        assert "max_sharpe" in data
        assert "min_volatility" in data

    def test_optimize_needs_two_tickers(self, client: TestClient):
        resp = client.post("/api/optimize", json={"tickers": ["AAPL"]})
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Dividends analysis — POST /api/dividends/analyze
# ---------------------------------------------------------------------------

class TestDividendsRouter:
    def _mock_result(self):
        return {
            "ticker": "AAPL",
            "current_price": 175.50,
            "dividend_yield": 0.005,
            "annual_dividend": 0.96,
            "payout_ratio": 0.15,
            "sustainability_score": "High",
            "ddm_fair_value": 14.11,
            "valuation": "Overvalued",
            "growth_rates": {"1yr": 0.04, "3yr": 0.05, "5yr": 0.06, "10yr": 0.07},
            "upcoming_ex_date": "2025-11-10",
            "history": [],
        }

    def test_dividend_analyze_success(self, client: TestClient):
        with patch("api.routers.dividends.analyze_dividend", return_value=self._mock_result()):
            resp = client.post("/api/dividends/analyze", json={"ticker": "AAPL"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["ticker"] == "AAPL"
        assert "sustainability_score" in data

    def test_dividend_analyze_missing_ticker(self, client: TestClient):
        resp = client.post("/api/dividends/analyze", json={})
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Portfolio — GET /api/portfolio, POST /api/portfolio/upload
# ---------------------------------------------------------------------------

class TestPortfolioRouter:
    def test_get_portfolio_empty(self, client: TestClient):
        with patch(
            "api.routers.portfolio.get_portfolio_summary",
            return_value={
                "holdings": [],
                "total_value": 0,
                "total_cost": 0,
                "total_gain": 0,
                "total_gain_pct": 0,
                "allocation": [],
            },
        ):
            resp = client.get("/api/portfolio")
        assert resp.status_code == 200
        assert resp.json()["holdings"] == []

    def test_upload_wrong_extension(self, client: TestClient):
        from io import BytesIO

        resp = client.post(
            "/api/portfolio/upload",
            files={"file": ("data.txt", BytesIO(b"hello"), "text/plain")},
        )
        assert resp.status_code == 400
        assert "csv" in resp.json()["detail"].lower() or "xlsx" in resp.json()["detail"].lower()

    def test_upload_csv_success(self, client: TestClient, sample_portfolio_csv):
        mock_summary = {
            "holdings": [{"ticker": "AAPL", "shares": 10}],
            "total_value": 1755.0,
            "total_cost": 1500.0,
            "total_gain": 255.0,
            "total_gain_pct": 17.0,
            "allocation": [{"ticker": "AAPL", "pct": 100}],
        }
        with patch("api.routers.portfolio.import_from_file", return_value=mock_summary):
            from io import BytesIO

            resp = client.post(
                "/api/portfolio/upload",
                files={"file": ("portfolio.csv", BytesIO(sample_portfolio_csv), "text/csv")},
            )
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Screener / Scanner endpoints
# ---------------------------------------------------------------------------

class TestScreenerRouter:
    def test_screener_default(self, client: TestClient):
        with patch("api.routers.screener.screen_custom", return_value=[]):
            resp = client.get("/api/screener")
        assert resp.status_code == 200

    def test_scanner_dividends(self, client: TestClient):
        with patch("api.routers.screener.scan_dividend_stalwarts", return_value=[]):
            resp = client.get("/api/scanner/dividends")
        assert resp.status_code == 200

    def test_scanner_tech(self, client: TestClient):
        with patch("api.routers.screener.scan_emerging_tech", return_value=[]):
            resp = client.get("/api/scanner/tech")
        assert resp.status_code == 200

    def test_scanner_limit_validation(self, client: TestClient):
        resp = client.get("/api/scanner/dividends?limit=0")
        assert resp.status_code == 422

    def test_scanner_limit_max(self, client: TestClient):
        resp = client.get("/api/scanner/dividends?limit=100")
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Net worth endpoints
# ---------------------------------------------------------------------------

class TestNetWorthRouter:
    def test_create_asset(self, client: TestClient):
        with patch("api.routers.networth.add_asset", return_value={"id": 1, "name": "Car", "value": 25000}):
            resp = client.post(
                "/api/net-worth/assets",
                json={"name": "Car", "value": 25000},
            )
        assert resp.status_code == 200

    def test_list_assets(self, client: TestClient):
        with patch("api.routers.networth.get_assets", return_value=[]):
            resp = client.get("/api/net-worth/assets")
        assert resp.status_code == 200

    def test_create_liability(self, client: TestClient):
        with patch(
            "api.routers.networth.add_liability",
            return_value={"id": 1, "name": "Mortgage", "balance": 200000},
        ):
            resp = client.post(
                "/api/net-worth/liabilities",
                json={"name": "Mortgage", "balance": 200000},
            )
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Cashflow endpoints
# ---------------------------------------------------------------------------

class TestCashflowRouter:
    def test_add_income(self, client: TestClient):
        with patch("api.routers.cashflow.add_income", return_value={"id": 1, "source": "Salary"}):
            resp = client.post(
                "/api/cashflow/income",
                json={"source": "Salary", "amount": 5000, "frequency": "monthly"},
            )
        assert resp.status_code == 200

    def test_add_income_invalid_frequency(self, client: TestClient):
        resp = client.post(
            "/api/cashflow/income",
            json={"source": "Job", "amount": 5000, "frequency": "daily"},
        )
        assert resp.status_code == 400

    def test_add_bill(self, client: TestClient):
        with patch("api.routers.cashflow.add_bill", return_value={"id": 1, "name": "Rent"}):
            resp = client.post(
                "/api/cashflow/bills",
                json={"name": "Rent", "amount": 1500, "due_day": 1},
            )
        assert resp.status_code == 200

    def test_list_transactions(self, client: TestClient):
        with patch("api.routers.cashflow.get_transactions", return_value=[]):
            resp = client.get("/api/cashflow/transactions")
        assert resp.status_code == 200
