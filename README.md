# Fidelity Fund Analyzer

**Fidelity mutual fund analysis -- performance comparison, expense ratio optimization, and portfolio allocation across 6 investment strategies.**

![Status](https://img.shields.io/badge/status-maintained-blue)
![Python](https://img.shields.io/badge/python-3.x-blue)
![License](https://img.shields.io/badge/license-personal_use-lightgrey)

## What It Does

Compares 30+ investment options across Fidelity mutual funds and ETFs, generating detailed portfolio allocation reports for 6 distinct strategies ranging from Conservative to Moonshot. Includes 1-year projections, risk profiles, expense ratio analysis, and dollar-cost averaging implementation guides.

## Features

- **6 portfolio strategies** -- Conservative, Moderate, Growth, Aggressive, Moonshot, Global Diversified
- **30+ investments analyzed** -- Fidelity mutual funds (FFVTX, FBIOX, FXAIX, etc.) and ETFs (QQQ, VTI, ARKK, etc.)
- **Expense ratio optimization** -- compare cost efficiency across fund families
- **1-year projections** -- based on historical performance data
- **Rebalancing guides** -- quarterly targets by strategy type
- **Automated weekly reports** -- GitHub Actions generates fresh analysis every Friday

## Tech Stack

- **Python** (pure standard library, no external dependencies)
- **GitHub Actions** (weekly report generation)

## Quick Start

```bash
# No dependencies required -- pure Python
python Fidelity-Fund-Analyzer/portfolio_analyzer.py
```

Outputs a full formatted report with fund comparisons, strategy allocations, and implementation guides.

## Strategy Overview

| Strategy | Expected Return | Max Drawdown | Best For |
|----------|----------------|--------------|----------|
| Conservative | 5-7% | -15% | Risk-averse, income |
| Moderate | 8-12% | -25% | Balanced growth |
| Growth | 12-18% | -35% | Medium risk tolerance |
| Aggressive | 25-40% | -50% | High growth, young investors |
| Moonshot | 60-150%+ | -70%+ | Extreme risk tolerance |
| Global Diversified | 10-16% | -30% | International exposure |

## License

Personal use only.
