# 📊 Portfolio Analyzer

**Comprehensive investment portfolio analyzer** — compare 6 distinct strategies across Fidelity mutual funds, ETFs, and best-in-class investments.

## Quick Start

```bash
python portfolio_analyzer.py
```

Generates a full report with:
- **30+ investment options** — Fidelity funds + ETFs
- **6 complete strategies** — Conservative → Moonshot
- **Detailed allocations** — fund mix, 1-year projections, risk profiles
- **Implementation guides** — dollar-cost averaging, rebalancing, monitoring

## 6 Strategies

| Strategy | Expected Return | Max Drawdown | Best For |
|----------|-----------------|--------------|----------|
| 🛡️ Conservative | 5-7% | -15% | Risk-averse, income |
| 🎯 Moderate | 8-12% | -25% | Balanced growth |
| 📈 Growth | 12-18% | -35% | Medium risk tolerance |
| 🚀 Aggressive | 25-40% | -50% | High growth, young |
| 💥 Moonshot | 60-150%+ | -70%+ | YOLO, extreme risk |
| 🌍 Global Diversified | 10-16% | -30% | International exposure |

## Available Investments

### Fidelity Mutual Funds
- **Large-Cap Growth:** FFVTX, FLPSX
- **Sector Focused:** FBIOX, FSHBX, FSPHX
- **Balanced & Income:** FXAIX, FSKAX, FAGIX
- **International:** FEMKX, FIEUX
- **Bonds:** FBNDX, FTABX

### ETFs
- **Broad Market:** VTI, ITOT
- **Tech & Growth:** QQQ, SMH, XLK
- **Specialty:** ARKK, ICLN, IBB, IBIT
- **Bonds:** BND, AGG
- **Dividend:** SCHD, VYM
- **International:** VXUS, IEMG

## Features

✅ **Dollar-cost averaging** — spread investments over 3-4 months
✅ **Rebalancing guides** — quarterly targets
✅ **Tax efficiency tips** — mutual funds vs ETFs
✅ **Risk monitoring** — by strategy type
✅ **1-year projections** — based on historical data

## Running Locally

```bash
# Install dependencies (none required — pure Python)
python portfolio_analyzer.py

# Output: Full formatted report to console
```

## Auto-Generated Reports

**Latest report:** [PORTFOLIO_REPORT.md](./PORTFOLIO_REPORT.md)

Runs weekly on Friday at 4 PM EST via GitHub Actions. Latest findings automatically committed.

## Key Principles

1. **Emergency fund first** — 6 months expenses before investing
2. **Dollar-cost average** — don't invest lump sum
3. **Rebalance quarterly** — keep positions on target
4. **Monitor by risk level:**
   - Conservative/Moderate: Quarterly
   - Aggressive/Moonshot: Monthly to weekly
5. **Mix Fidelity + ETFs** — expertise + low costs

## License

Personal use only.
