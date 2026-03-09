/**
 * Metric translation layer for Simple/Advanced mode.
 *
 * Each entry maps a raw metric key to plain-English labels,
 * formatted values, one-sentence explanations, and a verdict
 * function that returns good/warning/bad with a human message.
 */

export interface Verdict {
  status: "good" | "warning" | "bad";
  message: string;
}

export interface MetricTranslation {
  simpleLabel: string;
  simpleFormat: (value: number) => string;
  explanation: string;
  verdict: (value: number) => Verdict;
}

function pct(v: number, decimals = 1): string {
  return `${(v * 100).toFixed(decimals)}%`;
}

export const TRANSLATIONS: Record<string, MetricTranslation> = {
  /* ── Risk Metrics ─────────────────────────────────── */
  sharpe_ratio: {
    simpleLabel: "Risk-Adjusted Score",
    simpleFormat: (v) =>
      v >= 2 ? "Excellent" : v >= 1 ? "Good" : v >= 0.5 ? "Fair" : "Poor",
    explanation:
      "Measures how much return you earn for each unit of risk taken.",
    verdict: (v) =>
      v >= 1
        ? { status: "good", message: "Strong returns relative to risk" }
        : v >= 0.5
          ? { status: "warning", message: "Moderate returns for the risk taken" }
          : { status: "bad", message: "Returns don't justify the risk" },
  },

  sortino_ratio: {
    simpleLabel: "Downside Protection",
    simpleFormat: (v) =>
      v >= 2 ? "Strong" : v >= 1 ? "Adequate" : v >= 0.5 ? "Weak" : "Poor",
    explanation:
      "Like the risk score, but only counts bad volatility — ignores good surprises.",
    verdict: (v) =>
      v >= 1
        ? { status: "good", message: "Well protected against downside moves" }
        : v >= 0.5
          ? { status: "warning", message: "Some downside vulnerability" }
          : { status: "bad", message: "Significant downside exposure" },
  },

  annualized_return: {
    simpleLabel: "Average Yearly Return",
    simpleFormat: (v) => `~${pct(v, 1)} per year`,
    explanation: "How much this has grown per year on average.",
    verdict: (v) =>
      v >= 0.1
        ? { status: "good", message: "Strong historical growth" }
        : v >= 0
          ? { status: "warning", message: "Modest growth — consider alternatives" }
          : { status: "bad", message: "Losing money on average" },
  },

  annualized_volatility: {
    simpleLabel: "Price Swings",
    simpleFormat: (v) =>
      v > 0.25
        ? "Very High"
        : v > 0.18
          ? "High"
          : v > 0.12
            ? "Moderate"
            : "Low",
    explanation:
      "How much the price bounces around. Higher = bigger ups AND downs.",
    verdict: (v) =>
      v <= 0.15
        ? { status: "good", message: "Relatively stable prices" }
        : v <= 0.22
          ? { status: "warning", message: "Expect noticeable price swings" }
          : { status: "bad", message: "Very volatile — prepare for big swings" },
  },

  max_drawdown: {
    simpleLabel: "Worst-Case Drop",
    simpleFormat: (v) => `Could drop ${pct(Math.abs(v), 0)} from peak`,
    explanation:
      "The biggest drop from a high point to a low point in the period.",
    verdict: (v) => {
      const abs = Math.abs(v);
      return abs <= 0.15
        ? { status: "good", message: "Manageable worst-case decline" }
        : abs <= 0.3
          ? { status: "warning", message: "Significant potential drop in downturns" }
          : { status: "bad", message: "Could lose 30%+ in a bad stretch" };
    },
  },

  var_95: {
    simpleLabel: "Bad Year Loss",
    simpleFormat: (v) =>
      `In a bad year, could lose ~${pct(Math.abs(v), 0)}`,
    explanation:
      "The most you could lose in 95% of scenarios over a year.",
    verdict: (v) => {
      const abs = Math.abs(v);
      return abs <= 0.1
        ? { status: "good", message: "Limited downside in most scenarios" }
        : abs <= 0.2
          ? { status: "warning", message: "Meaningful loss possible in bad years" }
          : { status: "bad", message: "Could lose 20%+ in a rough year" };
    },
  },

  cvar_95: {
    simpleLabel: "Worst-Case Average Loss",
    simpleFormat: (v) =>
      `If things go wrong, average loss ~${pct(Math.abs(v), 0)}`,
    explanation:
      "The average loss in the worst 5% of scenarios — what happens when things really go south.",
    verdict: (v) => {
      const abs = Math.abs(v);
      return abs <= 0.15
        ? { status: "good", message: "Tail risk is contained" }
        : abs <= 0.25
          ? { status: "warning", message: "Tail risk is elevated" }
          : { status: "bad", message: "Severe losses possible in worst scenarios" };
    },
  },

  beta: {
    simpleLabel: "Market Sensitivity",
    simpleFormat: (v) =>
      v > 1.2
        ? `Moves ${v.toFixed(1)}x with the market — amplifies swings`
        : v >= 0.8
          ? "Moves roughly with the market"
          : `Only ${v.toFixed(1)}x of market moves — dampened`,
    explanation:
      "How much this moves compared to the S&P 500. 1.0 = same, 2.0 = twice as much.",
    verdict: (v) =>
      v <= 1.0
        ? { status: "good", message: "Less volatile than the overall market" }
        : v <= 1.3
          ? { status: "warning", message: "Slightly more volatile than the market" }
          : { status: "bad", message: "Amplifies market downturns significantly" },
  },

  alpha: {
    simpleLabel: "Beating the Market?",
    simpleFormat: (v) =>
      v > 0.02
        ? `Yes, by ~${pct(v, 1)}/year`
        : v >= -0.02
          ? "Roughly matching the market"
          : `No, trailing by ~${pct(Math.abs(v), 1)}/year`,
    explanation:
      "How much extra return above (or below) what the market risk alone would predict.",
    verdict: (v) =>
      v > 0
        ? { status: "good", message: "Outperforming on a risk-adjusted basis" }
        : v >= -0.02
          ? { status: "warning", message: "Performing about as expected for its risk" }
          : { status: "bad", message: "Underperforming — market index may be better" },
  },

  treynor_ratio: {
    simpleLabel: "Market Risk Efficiency",
    simpleFormat: (v) =>
      v >= 0.1 ? "Efficient" : v >= 0 ? "Fair" : "Inefficient",
    explanation: "Return earned per unit of market risk (beta).",
    verdict: (v) =>
      v >= 0.08
        ? { status: "good", message: "Good return per unit of market risk" }
        : v >= 0
          ? { status: "warning", message: "Modest market risk efficiency" }
          : { status: "bad", message: "Not compensating for market risk" },
  },

  calmar_ratio: {
    simpleLabel: "Recovery Efficiency",
    simpleFormat: (v) =>
      v >= 1 ? "Quick recovery" : v >= 0.5 ? "Moderate" : "Slow recovery",
    explanation:
      "Return divided by worst drop — how efficiently it recovers from losses.",
    verdict: (v) =>
      v >= 1
        ? { status: "good", message: "Returns well compensate for drawdowns" }
        : v >= 0.5
          ? { status: "warning", message: "Recovers, but slowly" }
          : { status: "bad", message: "Slow to recover from large drops" },
  },

  /* ── Monte Carlo ──────────────────────────────────── */
  prob_loss: {
    simpleLabel: "Chance of Losing Money",
    simpleFormat: (v) => `${(v * 100).toFixed(0)}% chance`,
    explanation:
      "Out of 10,000 simulated futures, how many ended with less than you started.",
    verdict: (v) =>
      v <= 0.1
        ? { status: "good", message: "Very low chance of loss" }
        : v <= 0.3
          ? { status: "warning", message: "Some chance of loss — monitor regularly" }
          : { status: "bad", message: "High chance of loss — consider adjustments" },
  },

  prob_target: {
    simpleLabel: "Chance of Reaching Goal",
    simpleFormat: (v) => `${(v * 100).toFixed(0)}% chance`,
    explanation:
      "How likely you are to reach your target based on 10,000 simulations.",
    verdict: (v) =>
      v >= 0.7
        ? { status: "good", message: "Strong probability of reaching your goal" }
        : v >= 0.4
          ? { status: "warning", message: "Possible but not certain — consider adjustments" }
          : { status: "bad", message: "Low probability — increase contributions or extend timeline" },
  },

  /* ── Dividend Analysis ────────────────────────────── */
  dividend_yield: {
    simpleLabel: "Income Per Year",
    simpleFormat: (v) =>
      `$${(v * 1000).toFixed(0)} per $1,000 invested`,
    explanation: "How much cash you receive annually per dollar invested.",
    verdict: (v) =>
      v >= 0.03
        ? { status: "good", message: "Solid income stream" }
        : v >= 0.01
          ? { status: "warning", message: "Modest income — growth may compensate" }
          : { status: "bad", message: "Minimal dividend income" },
  },

  payout_ratio: {
    simpleLabel: "Dividend Safety",
    simpleFormat: (v) =>
      v <= 0.6
        ? `Safe — pays out ${(v * 100).toFixed(0)}% of earnings`
        : v <= 0.8
          ? `Watch — pays out ${(v * 100).toFixed(0)}% of earnings`
          : `At Risk — pays out ${(v * 100).toFixed(0)}% of earnings`,
    explanation:
      "What percentage of profits go to dividends. Lower is safer.",
    verdict: (v) =>
      v <= 0.6
        ? { status: "good", message: "Plenty of room to maintain and grow the dividend" }
        : v <= 0.8
          ? { status: "warning", message: "Dividend is sustainable but leaves little margin" }
          : { status: "bad", message: "Paying out most earnings — dividend may be cut" },
  },

  sustainability_score: {
    simpleLabel: "Dividend Reliability",
    simpleFormat: (v) =>
      v >= 0.7 ? "Highly Reliable" : v >= 0.4 ? "Moderate" : "At Risk",
    explanation: "Overall assessment of whether this dividend will continue.",
    verdict: (v) =>
      v >= 0.7
        ? { status: "good", message: "Dividend looks sustainable long-term" }
        : v >= 0.4
          ? { status: "warning", message: "Dividend could be reduced in tough times" }
          : { status: "bad", message: "Dividend may not be sustainable" },
  },
};

export type MetricKey = keyof typeof TRANSLATIONS;
