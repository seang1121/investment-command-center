"""Security tests — input validation, CORS, path traversal, secret scanning."""

import os
import re
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# CORS configuration
# ---------------------------------------------------------------------------

class TestCORS:
    """Verify CORS middleware rejects unexpected origins."""

    def test_allowed_origin_localhost_3000(self, client: TestClient):
        resp = client.get(
            "/api/health",
            headers={"Origin": "http://localhost:3000"},
        )
        assert resp.status_code == 200
        assert resp.headers.get("access-control-allow-origin") == "http://localhost:3000"

    def test_allowed_origin_localhost_3100(self, client: TestClient):
        resp = client.get(
            "/api/health",
            headers={"Origin": "http://localhost:3100"},
        )
        assert resp.status_code == 200
        assert resp.headers.get("access-control-allow-origin") == "http://localhost:3100"

    def test_disallowed_origin_is_blocked(self, client: TestClient):
        resp = client.get(
            "/api/health",
            headers={"Origin": "https://evil.com"},
        )
        # FastAPI CORS middleware omits the header for disallowed origins
        assert resp.headers.get("access-control-allow-origin") is None

    def test_preflight_returns_allowed_methods(self, client: TestClient):
        resp = client.options(
            "/api/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
            },
        )
        assert resp.status_code == 200
        assert "POST" in resp.headers.get("access-control-allow-methods", "")


# ---------------------------------------------------------------------------
# Input validation / injection
# ---------------------------------------------------------------------------

class TestInputValidation:
    """Ensure malicious payloads are rejected cleanly."""

    def test_sql_injection_in_ticker(self, client: TestClient):
        """Ticker path param with SQL injection should 404 or 422, not 500."""
        with patch("api.routers.data.get_quote", side_effect=ValueError("bad")):
            resp = client.get("/api/quote/'; DROP TABLE users;--")
            assert resp.status_code in (404, 422)

    def test_xss_in_ticker(self, client: TestClient):
        """XSS payload in ticker should not reflect unescaped."""
        with patch("api.routers.data.get_quote", side_effect=ValueError("bad")):
            resp = client.get("/api/quote/<script>alert(1)</script>")
            assert resp.status_code in (404, 422)
            body = resp.text
            assert "<script>" not in body

    def test_risk_metrics_empty_tickers(self, client: TestClient):
        """Empty tickers list should be rejected by Pydantic validation."""
        resp = client.post("/api/risk-metrics", json={"tickers": []})
        assert resp.status_code == 422

    def test_risk_metrics_too_many_tickers(self, client: TestClient):
        """More than 20 tickers should fail validation."""
        tickers = [f"T{i}" for i in range(21)]
        resp = client.post("/api/risk-metrics", json={"tickers": tickers})
        assert resp.status_code == 422

    def test_monte_carlo_negative_horizon(self, client: TestClient):
        """time_horizon_years < 1 should fail validation."""
        resp = client.post(
            "/api/monte-carlo",
            json={"tickers": ["AAPL"], "time_horizon_years": 0},
        )
        assert resp.status_code == 422

    def test_monte_carlo_excessive_horizon(self, client: TestClient):
        """time_horizon_years > 30 should fail validation."""
        resp = client.post(
            "/api/monte-carlo",
            json={"tickers": ["AAPL"], "time_horizon_years": 50},
        )
        assert resp.status_code == 422

    def test_optimization_single_ticker_rejected(self, client: TestClient):
        """Optimization needs >= 2 tickers."""
        resp = client.post("/api/optimize", json={"tickers": ["AAPL"]})
        assert resp.status_code == 422

    def test_screener_limit_out_of_range(self, client: TestClient):
        """limit > 200 should be rejected."""
        resp = client.get("/api/screener?limit=500")
        assert resp.status_code == 422

    def test_cashflow_income_missing_source(self, client: TestClient):
        """Income source with empty/missing source should be rejected."""
        resp = client.post(
            "/api/cashflow/income",
            json={"source": "", "amount": 1000},
        )
        assert resp.status_code == 422

    def test_cashflow_bill_due_day_out_of_range(self, client: TestClient):
        """due_day > 31 should be rejected."""
        resp = client.post(
            "/api/cashflow/bills",
            json={"name": "Rent", "amount": 1500, "due_day": 32},
        )
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Path traversal
# ---------------------------------------------------------------------------

class TestPathTraversal:
    """Ensure path traversal attempts in ticker fields do not expose files."""

    TRAVERSAL_PAYLOADS = [
        "../../etc/passwd",
        "..%2F..%2Fetc%2Fpasswd",
        "....//....//etc/passwd",
        "/etc/passwd",
    ]

    @pytest.mark.parametrize("payload", TRAVERSAL_PAYLOADS)
    def test_path_traversal_in_quote(self, client: TestClient, payload: str):
        with patch("api.routers.data.get_quote", side_effect=ValueError("bad")):
            resp = client.get(f"/api/quote/{payload}")
            assert resp.status_code in (404, 422)
            assert "root:" not in resp.text

    @pytest.mark.parametrize("payload", TRAVERSAL_PAYLOADS)
    def test_path_traversal_in_history(self, client: TestClient, payload: str):
        with patch("api.routers.data.get_history", side_effect=ValueError("bad")):
            resp = client.get(f"/api/history/{payload}")
            assert resp.status_code in (404, 422)
            assert "root:" not in resp.text


# ---------------------------------------------------------------------------
# No hardcoded secrets in source code
# ---------------------------------------------------------------------------

class TestNoHardcodedSecrets:
    """Scan Python source files for patterns that look like leaked secrets."""

    SECRET_PATTERNS = [
        re.compile(r'(?:api[_-]?key|token|secret|password)\s*=\s*["\'][A-Za-z0-9+/=]{20,}["\']', re.IGNORECASE),
        re.compile(r'sk-[A-Za-z0-9]{20,}'),            # OpenAI style
        re.compile(r'ghp_[A-Za-z0-9]{36}'),             # GitHub PAT
        re.compile(r'AKIA[A-Z0-9]{16}'),                # AWS access key
        re.compile(r'xox[bprs]-[A-Za-z0-9\-]+'),       # Slack token
    ]

    def _source_files(self) -> list[Path]:
        root = Path(__file__).resolve().parent.parent
        py_files = list(root.glob("api/**/*.py"))
        top_level = list(root.glob("*.py"))
        return py_files + top_level

    def test_no_secrets_in_python_source(self):
        violations: list[str] = []
        for fpath in self._source_files():
            content = fpath.read_text(errors="ignore")
            for pattern in self.SECRET_PATTERNS:
                matches = pattern.findall(content)
                for m in matches:
                    violations.append(f"{fpath.name}: {m[:40]}...")

        assert violations == [], f"Potential secrets found:\n" + "\n".join(violations)

    def test_env_in_gitignore(self):
        """Verify .env is listed in .gitignore."""
        gitignore = Path(__file__).resolve().parent.parent / ".gitignore"
        if gitignore.exists():
            content = gitignore.read_text()
            assert ".env" in content, ".env must be in .gitignore"
        else:
            pytest.skip(".gitignore not found")
