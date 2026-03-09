/**
 * Pure functions that generate actionable recommendations from analysis data.
 *
 * Each function takes a response object and returns a list of recommendations
 * displayed in the RecommendationPanel below analysis results.
 */

import type { Recommendation } from "@/components/ui/recommendation-panel";
import type {
  RiskMetricsResponse,
  MonteCarloResponse,
  MonteCarloRequest,
  DividendAnalysis,
} from "./types";

/* ── Risk Metrics ──────────────────────────────────── */

export function generateRiskRecommendations(
  data: RiskMetricsResponse,
): Recommendation[] {
  const recs: Recommendation[] = [];

  // Sharpe ratio assessment
  if (data.sharpe_ratio >= 1.5) {
    recs.push({
      type: "insight",
      message:
        "Excellent risk-adjusted returns — your portfolio is well-positioned.",
    });
  } else if (data.sharpe_ratio < 0.5) {
    recs.push({
      type: "warning",
      message:
        "Returns aren't compensating for the risk. Consider diversifying.",
      linkTo: "/tools/efficient-frontier",
      linkLabel: "Optimize Portfolio",
    });
  }

  // Max drawdown
  if (Math.abs(data.max_drawdown) > 0.3) {
    recs.push({
      type: "warning",
      message: `Could drop ${(Math.abs(data.max_drawdown) * 100).toFixed(0)}%+ in a downturn. Stress test with Monte Carlo to see how this plays out over time.`,
      linkTo: "/tools/monte-carlo",
      linkLabel: "Run Monte Carlo",
    });
  } else if (Math.abs(data.max_drawdown) <= 0.15) {
    recs.push({
      type: "insight",
      message: "Low drawdown risk — portfolio holds up well in downturns.",
    });
  }

  // Beta
  if (data.beta !== null && data.beta > 1.3) {
    recs.push({
      type: "warning",
      message: `Beta of ${data.beta.toFixed(2)} means you amplify market drops. If the S&P drops 10%, you could drop ~${(data.beta * 10).toFixed(0)}%.`,
    });
  } else if (data.beta !== null && data.beta < 0.7) {
    recs.push({
      type: "insight",
      message: `Low beta (${data.beta.toFixed(2)}) — this portfolio is defensive and won't swing as much as the market.`,
    });
  }

  // Alpha
  if (data.alpha !== null) {
    if (data.alpha > 0.03) {
      recs.push({
        type: "insight",
        message: `Generating ~${(data.alpha * 100).toFixed(1)}% alpha — outperforming what the market risk alone would predict.`,
      });
    } else if (data.alpha < -0.03) {
      recs.push({
        type: "action",
        message:
          "Negative alpha suggests an index fund might deliver better results for the same risk.",
        linkTo: "/tools/screener",
        linkLabel: "Find Alternatives",
      });
    }
  }

  // Volatility
  if (data.annualized_volatility > 0.25) {
    recs.push({
      type: "warning",
      message:
        "High volatility — prices swing widely. Only suitable if you can stomach big drops.",
    });
  }

  // Sortino vs Sharpe comparison
  if (data.sortino_ratio > data.sharpe_ratio * 1.5) {
    recs.push({
      type: "insight",
      message:
        "Sortino is much higher than Sharpe — most volatility comes from upside surprises, which is a good sign.",
    });
  }

  // If everything looks good
  if (recs.length === 0) {
    recs.push({
      type: "insight",
      message:
        "Risk profile looks balanced. No major red flags detected.",
    });
  }

  return recs;
}

/* ── Monte Carlo ───────────────────────────────────── */

export function generateMonteCarloRecommendations(
  data: MonteCarloResponse,
  params: MonteCarloRequest,
): Recommendation[] {
  const recs: Recommendation[] = [];

  // Probability of loss
  if (data.prob_loss > 0.3) {
    recs.push({
      type: "warning",
      message: `${(data.prob_loss * 100).toFixed(0)}% chance of ending with less than you started. Consider extending your time horizon or reducing risk.`,
      linkTo: "/tools/efficient-frontier",
      linkLabel: "Optimize Allocation",
    });
  } else if (data.prob_loss <= 0.05) {
    recs.push({
      type: "insight",
      message: "Very low chance of loss — this plan looks solid.",
    });
  }

  // Target probability
  if (data.prob_target !== null && data.prob_target !== undefined) {
    if (data.prob_target >= 0.7) {
      recs.push({
        type: "insight",
        message: `${(data.prob_target * 100).toFixed(0)}% chance of reaching your goal — you're on track.`,
      });
    } else if (data.prob_target >= 0.4) {
      recs.push({
        type: "action",
        message: `Only ${(data.prob_target * 100).toFixed(0)}% chance of reaching your target. Increasing monthly contributions could improve your odds.`,
      });
    } else {
      recs.push({
        type: "warning",
        message: `Low ${(data.prob_target * 100).toFixed(0)}% probability of hitting your goal. Consider a longer time horizon, higher contributions, or more aggressive allocation.`,
      });
    }
  }

  // Worst case vs initial
  const initialInvestment = params.initial_investment ?? 10000;
  if (data.worst_case < initialInvestment * 0.5) {
    recs.push({
      type: "warning",
      message: `In the worst 5% of scenarios, you could lose more than half your investment. Make sure this money isn't needed short-term.`,
    });
  }

  // Median vs expected spread
  if (data.expected_final > data.median_final * 1.5) {
    recs.push({
      type: "insight",
      message:
        "Big gap between median and average outcome — a few very good scenarios pull the average up. Focus on the median as the more realistic expectation.",
    });
  }

  // Monthly contribution impact
  if ((params.monthly_contribution ?? 0) === 0 && data.prob_loss > 0.1) {
    recs.push({
      type: "action",
      message:
        "Adding a monthly contribution — even $100/month — can significantly reduce your chance of loss through dollar-cost averaging.",
    });
  }

  return recs;
}

/* ── Efficient Frontier ────────────────────────────── */

export function generateOptimizationRecommendations(
  data: {
    max_sharpe: {
      return: number;
      volatility: number;
      sharpe: number;
      weights: Record<string, number>;
    };
    min_volatility: {
      return: number;
      volatility: number;
      sharpe: number;
      weights: Record<string, number>;
    };
  },
): Recommendation[] {
  const recs: Recommendation[] = [];

  const ms = data.max_sharpe;
  const mv = data.min_volatility;

  // Return difference
  const returnDiff = ms.return - mv.return;
  const volDiff = ms.volatility - mv.volatility;

  if (returnDiff > 0.05) {
    recs.push({
      type: "insight",
      message: `The Max Sharpe portfolio earns ~${(returnDiff * 100).toFixed(1)}% more per year than the safest option, but with ${(volDiff * 100).toFixed(1)}% more volatility. Choose based on your comfort with risk.`,
    });
  }

  // Concentration warning
  const maxWeight = Math.max(...Object.values(ms.weights));
  if (maxWeight > 0.6) {
    const topTicker = Object.entries(ms.weights).sort(
      (a, b) => b[1] - a[1],
    )[0][0];
    recs.push({
      type: "warning",
      message: `The optimal portfolio puts ${(maxWeight * 100).toFixed(0)}% in ${topTicker}. That's concentrated — consider adding more tickers for diversification.`,
    });
  }

  // If min vol Sharpe is high
  if (mv.sharpe >= 1.0) {
    recs.push({
      type: "action",
      message:
        "The conservative (Min Volatility) portfolio still has a strong risk-adjusted score. If you prefer stability, it's a solid choice.",
    });
  }

  // Stress test recommendation
  recs.push({
    type: "action",
    message:
      "Run a Monte Carlo simulation with these weights to see how the portfolio performs over time.",
    linkTo: "/tools/monte-carlo",
    linkLabel: "Simulate Future",
  });

  return recs;
}

/* ── Dividend Analysis ─────────────────────────────── */

export function generateDividendRecommendations(
  data: DividendAnalysis,
): Recommendation[] {
  const recs: Recommendation[] = [];

  // Payout ratio
  if (data.payout_ratio !== null && data.payout_ratio !== undefined) {
    if (data.payout_ratio > 0.8) {
      recs.push({
        type: "warning",
        message: `Payout ratio of ${(data.payout_ratio * 100).toFixed(0)}% — the company is paying out most of its earnings. Dividend cuts are possible.`,
      });
    } else if (data.payout_ratio <= 0.5) {
      recs.push({
        type: "insight",
        message: `Low ${(data.payout_ratio * 100).toFixed(0)}% payout ratio — plenty of room to maintain and grow the dividend.`,
      });
    }
  }

  // Sustainability
  if (data.sustainability_score === "High") {
    recs.push({
      type: "insight",
      message: "High sustainability score — this dividend looks reliable for the long term.",
    });
  } else if (data.sustainability_score === "Low") {
    recs.push({
      type: "warning",
      message:
        "Low sustainability — the dividend may not hold up in a downturn. Research the company's balance sheet.",
    });
  }

  // Valuation
  if (data.valuation === "Undervalued") {
    recs.push({
      type: "action",
      message:
        "DDM model suggests this stock is trading below fair value. Could be a good entry point if fundamentals are solid.",
    });
  } else if (data.valuation === "Overvalued") {
    recs.push({
      type: "warning",
      message:
        "Trading above DDM fair value — the market may have priced in a lot of growth already.",
    });
  }

  // Yield assessment
  if (data.dividend_yield !== null && data.dividend_yield !== undefined) {
    if (data.dividend_yield > 0.06) {
      recs.push({
        type: "warning",
        message: `Yield of ${(data.dividend_yield * 100).toFixed(1)}% is unusually high. Very high yields can signal the market expects a dividend cut.`,
      });
    } else if (data.dividend_yield >= 0.03) {
      recs.push({
        type: "insight",
        message: `Solid ${(data.dividend_yield * 100).toFixed(1)}% yield — good income without being suspiciously high.`,
      });
    }
  }

  // Growth rate assessment
  if (data.growth_rates) {
    const g5 = data.growth_rates["5y"];
    if (g5 !== null && g5 !== undefined) {
      if (g5 > 0.08) {
        recs.push({
          type: "insight",
          message: `Strong 5-year dividend growth of ${(g5 * 100).toFixed(1)}%/year — a dividend grower, not just a payer.`,
        });
      } else if (g5 < 0) {
        recs.push({
          type: "warning",
          message: "Dividend has been shrinking over 5 years — not a reliable income source.",
        });
      }
    }
  }

  // Risk check recommendation
  recs.push({
    type: "action",
    message: "Check how this stock performs in downturns with a risk analysis.",
    linkTo: `/tools/risk-metrics?tickers=${data.ticker}`,
    linkLabel: "Analyze Risk",
  });

  return recs;
}

/* ── Compare Tool ──────────────────────────────────── */

export function generateCompareRecommendations(
  results: Array<{
    ticker: string;
    price: number;
    dividend_yield?: number | null;
    pe_ratio?: number | null;
    beta?: number | null;
    change_pct?: number;
  }>,
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (results.length < 2) return recs;

  // Best yield
  const withYield = results.filter((r) => r.dividend_yield && r.dividend_yield > 0);
  if (withYield.length > 0) {
    const bestYield = withYield.sort(
      (a, b) => (b.dividend_yield ?? 0) - (a.dividend_yield ?? 0),
    )[0];
    recs.push({
      type: "insight",
      message: `${bestYield.ticker} has the highest dividend yield at ${((bestYield.dividend_yield ?? 0) * 100).toFixed(1)}%.`,
      linkTo: `/tools/dividends?ticker=${bestYield.ticker}`,
      linkLabel: "Deep Dive",
    });
  }

  // Best value (lowest P/E)
  const withPE = results.filter((r) => r.pe_ratio && r.pe_ratio > 0);
  if (withPE.length > 0) {
    const bestValue = withPE.sort(
      (a, b) => (a.pe_ratio ?? 999) - (b.pe_ratio ?? 999),
    )[0];
    recs.push({
      type: "insight",
      message: `${bestValue.ticker} looks cheapest by P/E ratio (${bestValue.pe_ratio?.toFixed(1)}).`,
    });
  }

  // Lowest beta
  const withBeta = results.filter((r) => r.beta !== null && r.beta !== undefined);
  if (withBeta.length > 0) {
    const safest = withBeta.sort(
      (a, b) => (a.beta ?? 99) - (b.beta ?? 99),
    )[0];
    recs.push({
      type: "insight",
      message: `${safest.ticker} is the least volatile (beta ${safest.beta?.toFixed(2)}).`,
    });
  }

  // Suggestion to optimize
  if (results.length >= 2) {
    const tickers = results.map((r) => r.ticker).join(",");
    recs.push({
      type: "action",
      message:
        "Want to know the optimal mix of these? Run portfolio optimization.",
      linkTo: `/tools/efficient-frontier?tickers=${tickers}`,
      linkLabel: "Optimize Mix",
    });
  }

  return recs;
}

/* ── Screener ──────────────────────────────────────── */

export function generateScreenerRecommendations(
  results: Array<{
    ticker: string;
    signal: string;
    score: number;
    dividend_yield?: number | null;
  }>,
  scanType: string,
): Recommendation[] {
  const recs: Recommendation[] = [];

  const strongBuys = results.filter((r) => r.signal === "Strong Buy");
  const buys = results.filter(
    (r) => r.signal === "Buy" || r.signal === "Strong Buy",
  );

  if (strongBuys.length > 0) {
    const top3 = strongBuys
      .slice(0, 3)
      .map((r) => r.ticker)
      .join(", ");
    recs.push({
      type: "action",
      message: `Top picks from this scan: ${top3}. Consider running a deeper analysis on these.`,
      linkTo: `/tools/risk-metrics?tickers=${strongBuys.slice(0, 3).map((r) => r.ticker).join(",")}`,
      linkLabel: "Analyze Risk",
    });
  }

  if (buys.length >= 3) {
    const tickers = buys
      .slice(0, 5)
      .map((r) => r.ticker)
      .join(",");
    recs.push({
      type: "action",
      message: `Found ${buys.length} buy signals. Optimize the top picks into a portfolio.`,
      linkTo: `/tools/efficient-frontier?tickers=${tickers}`,
      linkLabel: "Build Portfolio",
    });
  }

  if (scanType === "dividend" || scanType === "dividends") {
    const highYield = results.filter(
      (r) => (r.dividend_yield ?? 0) > 0.05,
    );
    if (highYield.length > 0) {
      recs.push({
        type: "warning",
        message: `${highYield.length} stocks have yields above 5%. Very high yields can signal risk — check dividend sustainability before buying.`,
      });
    }
  }

  if (results.length === 0) {
    recs.push({
      type: "insight",
      message: "No strong signals found in this scan. Try a different category or check back later.",
    });
  }

  return recs;
}
