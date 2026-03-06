"""Fund and cash-alternative scanners for the Investment Command Center.

Two scanning agents:
1. Mutual Fund Scanner — Top index and actively managed funds
2. HYSA Alternative Scanner — T-bill & money market ETFs
"""

import logging
from typing import Any

from api.services.data_fetcher import (
    get_fundamentals,
    get_quote,
)

logger = logging.getLogger(__name__)

# ── Ticker Universes ──────────────────────────────────────

MUTUAL_FUND_UNIVERSE = [
    "FXAIX", "FSKAX", "VFIAX", "VTSAX", "SWPPX", "FBALX",
    "VBIAX", "FCNTX", "VWELX", "DODGX", "PRMTX", "TRBCX",
]

HYSA_UNIVERSE = [
    "BIL", "SHV", "SGOV", "USFR", "FLRN", "NEAR",
    "ICSH", "JPST", "MINT", "GSY",
]


def _score_signal(score: float) -> str:
    """Convert a 0-100 score into a buy/hold signal."""
    if score >= 85:
        return "Strong Buy"
    if score >= 70:
        return "Buy"
    if score >= 50:
        return "Hold"
    return "Watch"


# ── Mutual Fund Scanner ──────────────────────────────────

def scan_mutual_funds(limit: int = 20) -> list[dict]:
    """Scan top mutual funds and generate recommendations.

    Scores based on expense ratio (lower = better), 5yr return proxy,
    and fund category/type.
    """
    results: list[dict] = []
    for ticker in MUTUAL_FUND_UNIVERSE:
        try:
            result = _analyze_mutual_fund(ticker)
            if result:
                results.append(result)
        except Exception as e:
            logger.warning("Mutual fund scan failed for %s: %s", ticker, e)
            continue

    results.sort(key=lambda x: x.get("score", 0), reverse=True)
    return results[:limit]


def _analyze_mutual_fund(ticker: str) -> dict[str, Any] | None:
    """Score a single mutual fund ticker."""
    quote = get_quote(ticker)
    fund = get_fundamentals(ticker)

    expense_ratio = fund.get("expense_ratio")
    dividend_yield = quote.get("dividend_yield")

    result: dict[str, Any] = {
        "ticker": ticker,
        "name": quote.get("name", ""),
        "price": quote["price"],
        "change_pct": quote.get("change_pct", 0),
        "sector": fund.get("sector", "N/A"),
        "type": fund.get("type", "Mutual Fund"),
        "market_cap": quote.get("market_cap"),
        "pe_ratio": quote.get("pe_ratio"),
        "dividend_yield": dividend_yield,
        "beta": fund.get("beta"),
        "expense_ratio": expense_ratio,
    }

    # Score: expense ratio (40%) + performance proxy (30%) + quality (30%)
    score = 0.0

    # Expense ratio scoring (lower is better, max 40 pts)
    er = expense_ratio or 0.5
    if er < 0.001:       # < 0.1% -- index-like
        score += 40
    elif er < 0.005:     # < 0.5%
        score += 30
    elif er < 0.01:      # < 1.0%
        score += 20
    else:
        score += 10

    # Performance proxy: positive change + yield (max 30 pts)
    change = quote.get("change_pct", 0)
    if change > 0:
        score += min(change * 3, 15)
    dy = dividend_yield or 0
    score += min(dy * 300, 15)  # 5% yield = 15 pts

    # Quality: beta stability + fund type bonus (max 30 pts)
    beta = fund.get("beta")
    if beta is not None:
        if 0.8 <= beta <= 1.1:
            score += 15
        elif beta < 0.8:
            score += 10
        else:
            score += 5
    else:
        score += 10  # Unknown beta gets middle score

    fund_type = fund.get("type", "")
    if fund_type in ("Mutual Fund", "ETF"):
        score += 15
    else:
        score += 5

    result["score"] = round(score, 2)
    result["signal"] = _score_signal(score)
    result["reasons"] = _mutual_fund_reasons(result)
    return result


def _mutual_fund_reasons(result: dict) -> list[str]:
    """Generate recommendation reasons for mutual funds."""
    reasons: list[str] = []
    er = result.get("expense_ratio")
    if er is not None:
        if er < 0.001:
            reasons.append(f"Ultra-low expense ratio ({er*100:.2f}%)")
        elif er < 0.005:
            reasons.append(f"Low expense ratio ({er*100:.2f}%)")
        elif er >= 0.01:
            reasons.append(f"Higher expense ratio ({er*100:.2f}%) -- watch fees")

    dy = result.get("dividend_yield") or 0
    if dy > 0.02:
        reasons.append(f"Solid distribution yield ({dy*100:.1f}%)")

    if result.get("type") == "Mutual Fund":
        reasons.append("Mutual fund -- check minimums before investing")

    if not reasons:
        reasons.append("Meets baseline mutual fund screening criteria")
    return reasons


# ── HYSA Alternative Scanner ─────────────────────────────

def scan_hysa_alternatives(limit: int = 20) -> list[dict]:
    """Scan T-bill and money market ETFs as HYSA alternatives.

    Scores based on yield (higher = better) and expense ratio
    (lower = better). These are ultra-safe vehicles, so safety
    is assumed and yield drives the ranking.
    """
    results: list[dict] = []
    for ticker in HYSA_UNIVERSE:
        try:
            result = _analyze_hysa(ticker)
            if result:
                results.append(result)
        except Exception as e:
            logger.warning("HYSA scan failed for %s: %s", ticker, e)
            continue

    results.sort(key=lambda x: x.get("score", 0), reverse=True)
    return results[:limit]


def _analyze_hysa(ticker: str) -> dict[str, Any] | None:
    """Score a single HYSA-alternative ETF."""
    quote = get_quote(ticker)
    fund = get_fundamentals(ticker)

    dividend_yield = quote.get("dividend_yield")
    expense_ratio = fund.get("expense_ratio")

    result: dict[str, Any] = {
        "ticker": ticker,
        "name": quote.get("name", ""),
        "price": quote["price"],
        "change_pct": quote.get("change_pct", 0),
        "sector": fund.get("sector", "N/A"),
        "type": fund.get("type", "ETF"),
        "market_cap": quote.get("market_cap"),
        "pe_ratio": quote.get("pe_ratio"),
        "dividend_yield": dividend_yield,
        "beta": fund.get("beta"),
        "expense_ratio": expense_ratio,
    }

    # Score: yield (60%) + low expense (25%) + stability (15%)
    score = 0.0

    # Yield scoring (max 60 pts) -- higher yield = better for cash alternatives
    dy = dividend_yield or 0
    score += min(dy * 1200, 60)  # 5% yield = 60 pts

    # Expense ratio (max 25 pts) -- lower is better
    er = expense_ratio or 0.005
    if er < 0.001:
        score += 25
    elif er < 0.003:
        score += 20
    elif er < 0.005:
        score += 15
    else:
        score += 5

    # Stability (max 15 pts) -- low beta / low volatility preferred
    beta = fund.get("beta")
    if beta is not None:
        if beta < 0.1:
            score += 15
        elif beta < 0.3:
            score += 10
        else:
            score += 5
    else:
        score += 10  # T-bill ETFs often lack beta data

    result["score"] = round(score, 2)
    result["signal"] = _score_signal(score)
    result["reasons"] = _hysa_reasons(result)
    return result


def _hysa_reasons(result: dict) -> list[str]:
    """Generate recommendation reasons for HYSA alternatives."""
    reasons: list[str] = []
    dy = result.get("dividend_yield") or 0
    if dy > 0.04:
        reasons.append(f"Strong yield ({dy*100:.1f}%) -- competitive with HYSAs")
    elif dy > 0.02:
        reasons.append(f"Moderate yield ({dy*100:.1f}%)")
    elif dy > 0:
        reasons.append(f"Low yield ({dy*100:.1f}%) -- rates may be declining")

    er = result.get("expense_ratio")
    if er is not None and er < 0.001:
        reasons.append("Minimal fees")

    beta = result.get("beta")
    if beta is not None and beta < 0.1:
        reasons.append("Near-zero volatility -- true cash alternative")

    if not reasons:
        reasons.append("Meets baseline HYSA alternative criteria")
    return reasons
