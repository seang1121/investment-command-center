"""Portfolio health check — concentration, diversification, alerts."""

import logging

from api.services.portfolio_service import get_portfolio_summary

logger = logging.getLogger(__name__)


def check_portfolio_health() -> dict:
    """Run all portfolio health checks and return a scored report."""
    portfolio = get_portfolio_summary()
    holdings = portfolio.get("holdings", [])
    allocation = portfolio.get("allocation", [])
    total_value = portfolio.get("total_value", 0)

    checks: list[dict] = []
    recommendations: list[dict] = []
    score = 100

    if not holdings:
        return {
            "score": 0,
            "status": "needs_attention",
            "checks": [
                {
                    "severity": "warning",
                    "title": "No Holdings",
                    "message": "Upload a portfolio to get a health check.",
                }
            ],
            "recommendations": [
                {
                    "type": "action",
                    "message": "Go to Portfolio and upload your holdings.",
                }
            ],
        }

    # --- Check 1: Concentration risk ---
    for alloc in allocation:
        pct = alloc["pct"]
        ticker = alloc["ticker"]
        if pct > 40:
            checks.append({
                "severity": "critical",
                "title": f"Critical concentration: {ticker}",
                "message": (
                    f"{ticker} is {pct}% of your portfolio. "
                    "Consider rebalancing below 25%."
                ),
            })
            score -= 25
            recommendations.append({
                "type": "warning",
                "message": (
                    f"Reduce {ticker} position — {pct}% "
                    "concentration is very risky."
                ),
            })
        elif pct > 25:
            checks.append({
                "severity": "warning",
                "title": f"High concentration: {ticker}",
                "message": (
                    f"{ticker} is {pct}% of your portfolio. "
                    "Consider diversifying."
                ),
            })
            score -= 10
            recommendations.append({
                "type": "insight",
                "message": (
                    f"Consider trimming {ticker} — {pct}% "
                    "is above the 25% guideline."
                ),
            })

    # --- Check 2: Diversification ---
    num_holdings = len(holdings)
    if num_holdings < 3:
        checks.append({
            "severity": "warning",
            "title": "Low diversification",
            "message": (
                f"Only {num_holdings} holding(s). "
                "Consider adding more positions for diversification."
            ),
        })
        score -= 15
        recommendations.append({
            "type": "action",
            "message": "Add more holdings to reduce single-stock risk.",
        })
    else:
        checks.append({
            "severity": "good",
            "title": "Diversification OK",
            "message": f"{num_holdings} holdings provide reasonable spread.",
        })

    # --- Check 3: Individual loss alerts ---
    losers = [
        h for h in holdings
        if h.get("cost_basis") and h["gain_pct"] < -10
    ]
    for h in losers:
        checks.append({
            "severity": "warning",
            "title": f"{h['ticker']} down {abs(h['gain_pct'])}%",
            "message": (
                f"{h['ticker']} is down {abs(h['gain_pct'])}% "
                "from your cost basis. Review your thesis."
            ),
        })
        score -= 5
        recommendations.append({
            "type": "insight",
            "message": (
                f"Review {h['ticker']} — significant "
                f"unrealized loss of {abs(h['gain_pct'])}%."
            ),
        })

    if not losers:
        checks.append({
            "severity": "good",
            "title": "No major losers",
            "message": "All positions within normal range.",
        })

    # Clamp score
    score = max(0, min(100, score))

    if score >= 80:
        status = "excellent"
    elif score >= 60:
        status = "good"
    elif score >= 40:
        status = "fair"
    else:
        status = "needs_attention"

    if not recommendations:
        recommendations.append({
            "type": "insight",
            "message": "Portfolio looks healthy. Keep monitoring.",
        })

    return {
        "score": score,
        "status": status,
        "checks": checks,
        "recommendations": recommendations,
    }
