#!/usr/bin/env python3
"""
Comprehensive Portfolio Analyzer
Stocks + ETFs + Mutual Funds
6 Strategy Archetypes: Conservative → Moonshot
"""

import sys
import os
from datetime import datetime

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

class PortfolioAnalyzer:
    def __init__(self):
        # Organized by type and category
        self.funds = {
            'fidelity_large_cap': {
                'category': 'FIDELITY: LARGE-CAP GROWTH',
                'funds': {
                    'FFVTX': {
                        'name': 'Fidelity Large Cap Growth',
                        'type': 'Fidelity Mutual Fund',
                        'ytd': 0.18,
                        'one_yr': 0.35,
                        'three_yr': 0.38,
                        'dividend': 0.005,
                        'expense_ratio': 0.0065,
                        'risk': 'High'
                    },
                    'FLPSX': {
                        'name': 'Fidelity Growth Company Fund',
                        'type': 'Fidelity Mutual Fund',
                        'ytd': 0.20,
                        'one_yr': 0.38,
                        'three_yr': 0.40,
                        'dividend': 0.002,
                        'expense_ratio': 0.0070,
                        'risk': 'Very High'
                    },
                }
            },
            'fidelity_sector': {
                'category': 'FIDELITY: SECTOR FOCUSED',
                'funds': {
                    'FBIOX': {
                        'name': 'Fidelity Select Technology',
                        'type': 'Fidelity Mutual Fund',
                        'ytd': 0.28,
                        'one_yr': 0.55,
                        'three_yr': 0.52,
                        'dividend': 0.003,
                        'expense_ratio': 0.0090,
                        'risk': 'Very High'
                    },
                    'FSHBX': {
                        'name': 'Fidelity Select Semiconductors',
                        'type': 'Fidelity Mutual Fund',
                        'ytd': 0.32,
                        'one_yr': 0.62,
                        'three_yr': 0.58,
                        'dividend': 0.004,
                        'expense_ratio': 0.0095,
                        'risk': 'Extreme'
                    },
                    'FSPHX': {
                        'name': 'Fidelity Select Biotechnology',
                        'type': 'Fidelity Mutual Fund',
                        'ytd': 0.15,
                        'one_yr': 0.32,
                        'three_yr': 0.28,
                        'dividend': 0.002,
                        'expense_ratio': 0.0088,
                        'risk': 'Very High'
                    },
                }
            },
            'fidelity_balanced': {
                'category': 'FIDELITY: BALANCED & INCOME',
                'funds': {
                    'FXAIX': {
                        'name': 'Fidelity Total Market Index',
                        'type': 'Fidelity Mutual Fund',
                        'ytd': 0.10,
                        'one_yr': 0.22,
                        'three_yr': 0.18,
                        'dividend': 0.015,
                        'expense_ratio': 0.0015,
                        'risk': 'Moderate'
                    },
                    'FSKAX': {
                        'name': 'Fidelity Balanced Fund',
                        'type': 'Fidelity Mutual Fund',
                        'ytd': 0.08,
                        'one_yr': 0.16,
                        'three_yr': 0.12,
                        'dividend': 0.025,
                        'expense_ratio': 0.0045,
                        'risk': 'Moderate'
                    },
                    'FAGIX': {
                        'name': 'Fidelity Dividend Growth Fund',
                        'type': 'Fidelity Mutual Fund',
                        'ytd': 0.12,
                        'one_yr': 0.26,
                        'three_yr': 0.22,
                        'dividend': 0.032,
                        'expense_ratio': 0.0055,
                        'risk': 'Moderate-High'
                    },
                }
            },
            'fidelity_international': {
                'category': 'FIDELITY: INTERNATIONAL & EMERGING',
                'funds': {
                    'FEMKX': {
                        'name': 'Fidelity Emerging Markets Equity',
                        'type': 'Fidelity Mutual Fund',
                        'ytd': 0.14,
                        'one_yr': 0.28,
                        'three_yr': 0.24,
                        'dividend': 0.018,
                        'expense_ratio': 0.0063,
                        'risk': 'High'
                    },
                    'FIEUX': {
                        'name': 'Fidelity International Growth Fund',
                        'type': 'Fidelity Mutual Fund',
                        'ytd': 0.11,
                        'one_yr': 0.22,
                        'three_yr': 0.18,
                        'dividend': 0.012,
                        'expense_ratio': 0.0070,
                        'risk': 'High'
                    },
                }
            },
            'fidelity_bonds': {
                'category': 'FIDELITY: BONDS & FIXED INCOME',
                'funds': {
                    'FBNDX': {
                        'name': 'Fidelity Bond Fund',
                        'type': 'Fidelity Mutual Fund',
                        'ytd': 0.02,
                        'one_yr': 0.05,
                        'three_yr': 0.03,
                        'dividend': 0.035,
                        'expense_ratio': 0.0030,
                        'risk': 'Low'
                    },
                    'FTABX': {
                        'name': 'Fidelity Total Bond Fund',
                        'type': 'Fidelity Mutual Fund',
                        'ytd': 0.02,
                        'one_yr': 0.05,
                        'three_yr': 0.03,
                        'dividend': 0.040,
                        'expense_ratio': 0.0025,
                        'risk': 'Low'
                    },
                }
            },
            'etf_broad': {
                'category': 'BROAD MARKET ETFs',
                'funds': {
                    'VTI': {
                        'name': 'Vanguard Total Stock Market ETF',
                        'type': 'ETF',
                        'ytd': 0.10,
                        'one_yr': 0.22,
                        'three_yr': 0.18,
                        'dividend': 0.015,
                        'expense_ratio': 0.0003,
                        'risk': 'Moderate'
                    },
                    'ITOT': {
                        'name': 'iShares Core S&P Total U.S. Stock Market ETF',
                        'type': 'ETF',
                        'ytd': 0.10,
                        'one_yr': 0.22,
                        'three_yr': 0.18,
                        'dividend': 0.016,
                        'expense_ratio': 0.0003,
                        'risk': 'Moderate'
                    },
                }
            },
            'etf_tech': {
                'category': 'TECH & GROWTH ETFs',
                'funds': {
                    'QQQ': {
                        'name': 'Invesco QQQ Trust',
                        'type': 'ETF',
                        'ytd': 0.134,
                        'one_yr': 0.28,
                        'three_yr': 0.32,
                        'dividend': 0.004,
                        'expense_ratio': 0.0020,
                        'risk': 'High'
                    },
                    'SMH': {
                        'name': 'iShares Semiconductor ETF',
                        'type': 'ETF',
                        'ytd': 0.68,
                        'one_yr': 1.02,
                        'three_yr': 0.85,
                        'dividend': 0.008,
                        'expense_ratio': 0.0035,
                        'risk': 'Very High'
                    },
                    'XLK': {
                        'name': 'Technology Select Sector SPDR',
                        'type': 'ETF',
                        'ytd': 0.16,
                        'one_yr': 0.32,
                        'three_yr': 0.38,
                        'dividend': 0.005,
                        'expense_ratio': 0.0010,
                        'risk': 'High'
                    },
                }
            },
            'etf_specialty': {
                'category': 'SPECIALTY & THEMED ETFs',
                'funds': {
                    'ARKK': {
                        'name': 'ARK Innovation ETF',
                        'type': 'ETF',
                        'ytd': 0.28,
                        'one_yr': 0.52,
                        'three_yr': 0.42,
                        'dividend': 0.002,
                        'expense_ratio': 0.0075,
                        'risk': 'Extreme'
                    },
                    'ICLN': {
                        'name': 'iShares Global Clean Energy ETF',
                        'type': 'ETF',
                        'ytd': 0.31,
                        'one_yr': 0.58,
                        'three_yr': 0.35,
                        'dividend': 0.018,
                        'expense_ratio': 0.0040,
                        'risk': 'High'
                    },
                    'IBB': {
                        'name': 'iShares Nasdaq Biotechnology',
                        'type': 'ETF',
                        'ytd': 0.18,
                        'one_yr': 0.34,
                        'three_yr': 0.28,
                        'dividend': 0.003,
                        'expense_ratio': 0.0045,
                        'risk': 'Very High'
                    },
                    'IBIT': {
                        'name': 'iShares Bitcoin Mini Trust',
                        'type': 'ETF',
                        'ytd': 0.92,
                        'one_yr': 1.68,
                        'three_yr': 1.42,
                        'dividend': 0.0,
                        'expense_ratio': 0.0020,
                        'risk': 'Extreme'
                    },
                }
            },
            'etf_bonds': {
                'category': 'BONDS & FIXED INCOME ETFs',
                'funds': {
                    'BND': {
                        'name': 'Vanguard Total Bond Market ETF',
                        'type': 'ETF',
                        'ytd': 0.02,
                        'one_yr': 0.05,
                        'three_yr': 0.03,
                        'dividend': 0.042,
                        'expense_ratio': 0.0003,
                        'risk': 'Low'
                    },
                    'AGG': {
                        'name': 'iShares Core U.S. Aggregate Bond ETF',
                        'type': 'ETF',
                        'ytd': 0.02,
                        'one_yr': 0.05,
                        'three_yr': 0.03,
                        'dividend': 0.044,
                        'expense_ratio': 0.0003,
                        'risk': 'Low'
                    },
                }
            },
            'etf_dividend': {
                'category': 'DIVIDEND & INCOME ETFs',
                'funds': {
                    'SCHD': {
                        'name': 'Schwab U.S. Dividend Equity ETF',
                        'type': 'ETF',
                        'ytd': 0.12,
                        'one_yr': 0.26,
                        'three_yr': 0.22,
                        'dividend': 0.035,
                        'expense_ratio': 0.0006,
                        'risk': 'Moderate'
                    },
                    'VYM': {
                        'name': 'Vanguard High Dividend Yield ETF',
                        'type': 'ETF',
                        'ytd': 0.11,
                        'one_yr': 0.24,
                        'three_yr': 0.20,
                        'dividend': 0.038,
                        'expense_ratio': 0.0006,
                        'risk': 'Moderate'
                    },
                }
            },
            'etf_international': {
                'category': 'INTERNATIONAL ETFs',
                'funds': {
                    'VXUS': {
                        'name': 'Vanguard International Stock ETF',
                        'type': 'ETF',
                        'ytd': 0.09,
                        'one_yr': 0.18,
                        'three_yr': 0.14,
                        'dividend': 0.018,
                        'expense_ratio': 0.0009,
                        'risk': 'Moderate-High'
                    },
                    'IEMG': {
                        'name': 'iShares MSCI Emerging Markets ETF',
                        'type': 'ETF',
                        'ytd': 0.16,
                        'one_yr': 0.32,
                        'three_yr': 0.26,
                        'dividend': 0.019,
                        'expense_ratio': 0.0008,
                        'risk': 'High'
                    },
                }
            },
        }

        # 6 Strategy Archetypes
        self.strategies = {
            'strategy_1': {
                'name': '🛡️ CONSERVATIVE',
                'subtitle': 'Capital Preservation + Steady Income',
                'description': 'Bonds + dividend stocks, minimal volatility',
                'allocation': {
                    'FBNDX': 0.40,  # Bonds
                    'FTABX': 0.20,  # Total Bond
                    'FAGIX': 0.15,  # Dividend Growth
                    'SCHD': 0.15,   # Dividend ETF
                    'FXAIX': 0.10,  # Total Market (safety)
                },
                'expected_return': '5-7% annual',
                'max_drawdown': '-15% worst case',
                'time_horizon': '1-3 years',
                'best_for': 'Risk-averse, income-focused, near retirement'
            },
            'strategy_2': {
                'name': '🎯 MODERATE',
                'subtitle': 'Balanced Growth + Income',
                'description': '60/40 stocks-bonds, steady growth with downside protection',
                'allocation': {
                    'FSKAX': 0.25,  # Balanced Fund
                    'FXAIX': 0.20,  # Total Market
                    'BND': 0.20,    # Bonds ETF
                    'FAGIX': 0.15,  # Dividend Growth
                    'VXUS': 0.10,   # International
                    'SCHD': 0.10,   # Dividend ETF
                },
                'expected_return': '8-12% annual',
                'max_drawdown': '-25% worst case',
                'time_horizon': '2-5 years',
                'best_for': 'Balanced growth, mid-career, 401k alternative'
            },
            'strategy_3': {
                'name': '📈 GROWTH',
                'subtitle': 'Solid Growth + Diversification',
                'description': 'Growth stocks + sectors + international, some bonds',
                'allocation': {
                    'FFVTX': 0.18,  # Fidelity Large Cap Growth
                    'QQQ': 0.15,    # Tech ETF
                    'FXAIX': 0.15,  # Total Market
                    'FBIOX': 0.10,  # Tech Sector
                    'IEMG': 0.10,   # Emerging Markets
                    'BND': 0.15,    # Bonds (downside protection)
                    'SCHD': 0.08,   # Dividend ETF
                    'ICLN': 0.09,   # Clean Energy
                },
                'expected_return': '12-18% annual',
                'max_drawdown': '-35% worst case',
                'time_horizon': '3-5 years',
                'best_for': 'Growth-oriented, medium risk tolerance, 3-5 year horizon'
            },
            'strategy_4': {
                'name': '🚀 AGGRESSIVE',
                'subtitle': 'High Growth + Concentrated Bets',
                'description': 'Growth + sectors + emerging markets, minimal bonds',
                'allocation': {
                    'QQQ': 0.18,      # Tech ETF
                    'FBIOX': 0.12,    # Tech Sector
                    'FFVTX': 0.12,    # Large Cap Growth
                    'FLPSX': 0.10,    # Growth Company
                    'SMH': 0.10,      # Semiconductors
                    'ARKK': 0.08,     # Innovation
                    'IEMG': 0.08,     # Emerging Markets
                    'IBB': 0.07,      # Biotech
                    'ICLN': 0.08,     # Clean Energy
                    'BND': 0.07,      # Bonds (emergency buffer)
                },
                'expected_return': '25-40% annual',
                'max_drawdown': '-50% worst case',
                'time_horizon': '3-5 years',
                'best_for': 'Aggressive growth, high risk tolerance, young investor'
            },
            'strategy_5': {
                'name': '💥 MOONSHOT',
                'subtitle': 'Maximum Growth + Crypto + Leverage',
                'description': 'Bleeding-edge tech, crypto, leverage, maximum volatility',
                'allocation': {
                    'IBIT': 0.20,     # Bitcoin ETF
                    'ARKK': 0.15,     # Innovation
                    'QQQ': 0.15,      # Tech ETF
                    'FSHBX': 0.12,    # Semiconductors
                    'SMH': 0.10,      # Semiconductor ETF
                    'FLPSX': 0.10,    # Growth Company
                    'IBB': 0.08,      # Biotech
                    'FBIOX': 0.05,    # Tech Sector (small)
                    'ICLN': 0.05,     # Clean Energy (small)
                },
                'expected_return': '60-150%+ annual',
                'max_drawdown': '-70%+ worst case',
                'time_horizon': '3-7 years',
                'best_for': 'Moonshot bets, extreme risk tolerance, YOLO mindset'
            },
            'strategy_6': {
                'name': '🌍 GLOBAL DIVERSIFIED',
                'subtitle': 'Balanced Global + Sector Rotation',
                'description': 'US/International blend, reduced single-country risk',
                'allocation': {
                    'FXAIX': 0.18,    # Total Market (US)
                    'VXUS': 0.15,     # International
                    'IEMG': 0.12,     # Emerging Markets
                    'QQQ': 0.12,      # Tech (growth)
                    'FIEUX': 0.10,    # Intl Growth
                    'BND': 0.15,      # Bonds (stability)
                    'SCHD': 0.10,     # Dividend ETF
                    'ICLN': 0.05,     # Clean Energy
                    'FAGIX': 0.03,    # Dividend Growth (small)
                },
                'expected_return': '10-16% annual',
                'max_drawdown': '-30% worst case',
                'time_horizon': '3-5 years',
                'best_for': 'Currency hedging, emerging market exposure, global diversification'
            },
        }

    def print_fund_catalog(self):
        """Print all available funds by category"""
        print(f"\n{'='*130}")
        print("📚 AVAILABLE INVESTMENTS CATALOG")
        print(f"{'='*130}\n")

        for category_key, category_data in self.funds.items():
            print(f"\n{category_data['category']}")
            print(f"{'-'*130}")
            print(f"{'Symbol':<10} {'Fund Name':<45} {'Type':<25} {'1-Yr':<10} {'Dividend':<12} {'Risk':<15}")
            print(f"{'-'*130}")

            for symbol, fund_data in category_data['funds'].items():
                print(
                    f"{symbol:<10} {fund_data['name']:<45} {fund_data['type']:<25} "
                    f"{fund_data['one_yr']*100:>6.0f}%    {fund_data['dividend']*100:>5.2f}%    {fund_data['risk']:<15}"
                )

    def print_strategy_comparison(self):
        """Compare all 6 strategies side-by-side"""
        print(f"\n{'='*130}")
        print("ALL 6 STRATEGIES COMPARISON")
        print(f"{'='*130}\n")

        print(f"{'Strategy':<20} {'Expected Return':<22} {'Max Drawdown':<20} {'Time Horizon':<20} {'Risk Level':<20}")
        print(f"{'-'*130}")

        for strategy_key in ['strategy_1', 'strategy_2', 'strategy_3', 'strategy_4', 'strategy_5', 'strategy_6']:
            s = self.strategies[strategy_key]
            expected = s['expected_return']
            drawdown = s['max_drawdown']
            horizon = s['time_horizon']
            risk = 'EXTREME' if 'Moonshot' in s['name'] else ('HIGH' if 'Aggressive' in s['name'] else 'MODERATE' if 'Moderate' in s['name'] else 'LOW' if 'Conservative' in s['name'] else 'MODERATE-HIGH')
            print(f"{s['name']:<20} {expected:<22} {drawdown:<20} {horizon:<20} {risk:<20}")

    def print_strategy_detail(self, strategy_key):
        """Print detailed breakdown for one strategy"""
        strategy = self.strategies[strategy_key]
        allocation = strategy['allocation']

        print(f"\n{'='*130}")
        print(strategy['name'])
        print(strategy['subtitle'])
        print(f"{'='*130}\n")

        print(f"Expected Annual Return:  {strategy['expected_return']}")
        print(f"Max Drawdown Risk:       {strategy['max_drawdown']}")
        print(f"Time Horizon:            {strategy['time_horizon']}")
        print(f"Best For:                {strategy['best_for']}\n")

        # Portfolio breakdown
        print("PORTFOLIO ALLOCATION:\n")
        print(f"{'Symbol':<10} {'Fund Name':<45} {'Allocation':<15} {'$1K Invested':<18} {'1-Year Value':<18} {'Gain/Loss':<15}")
        print(f"{'-'*130}")

        total_value = 0
        for symbol, pct in sorted(allocation.items(), key=lambda x: x[1], reverse=True):
            # Find fund data
            fund_data = None
            for category in self.funds.values():
                if symbol in category['funds']:
                    fund_data = category['funds'][symbol]
                    break

            if fund_data:
                invested = 1000 * pct
                one_yr_return = fund_data['one_yr']
                ending_value = invested * (1 + one_yr_return)
                gain = ending_value - invested
                total_value += ending_value

                print(
                    f"{symbol:<10} {fund_data['name']:<45} {pct*100:>6.0f}%      "
                    f"${invested:>7,.0f}         ${ending_value:>7,.0f}         ${gain:>7,.0f}"
                )

        print(f"{'-'*130}")
        total_gain = total_value - 10000
        print(f"{'TOTAL':<10} {'':<45} {'100%':<15} {'$10,000':<18} '${total_value:>8,.0f}'       ${total_gain:>8,.0f}")

        print(f"\n\nRECOMMENDED IMPLEMENTATION:")
        print(f"├─ Month 1-2: Invest ~$3,300 (core positions)")
        print(f"├─ Month 2-3: Invest ~$3,300 (diversify)")
        print(f"├─ Month 3-4: Invest ~$3,400 (complete allocation)")
        print(f"├─ Quarterly:  Rebalance to targets")
        print(f"└─ On 20%+ dips: Deploy cash reserves")

    def generate_report(self):
        """Generate complete multi-strategy report"""
        print("\n" + "="*130)
        print("📊 COMPREHENSIVE PORTFOLIO ANALYZER")
        print("Stocks + ETFs + Mutual Funds | 6 Complete Strategy Archetypes")
        print(f"Generated: {datetime.now().strftime('%A, %B %d, %Y — %I:%M %p EST')}")
        print("="*130)

        # 1. Fund catalog
        self.print_fund_catalog()

        # 2. All strategies comparison
        self.print_strategy_comparison()

        # 3. Detailed breakdowns for each strategy
        for strategy_key in ['strategy_1', 'strategy_2', 'strategy_3', 'strategy_4', 'strategy_5', 'strategy_6']:
            self.print_strategy_detail(strategy_key)

        # 4. Final guidance
        print(f"\n\n{'='*130}")
        print("⚠️  KEY PRINCIPLES")
        print(f"{'='*130}\n")

        print("1. **Dollar-Cost Averaging:**")
        print("   Spread $10K over 3-4 months, not lump sum. Reduces timing risk.\n")

        print("2. **Rebalancing:**")
        print("   Review quarterly. Rebalance when any position deviates >20% from target.\n")

        print("3. **Emergency Fund First:**")
        print("   Keep 6 months expenses in safe funds BEFORE aggressive strategies.\n")

        print("4. **Fidelity vs ETFs:**")
        print("   Fidelity funds offer expertise; ETFs offer low costs. Mix both for balance.\n")

        print("5. **Tax Efficiency:**")
        print("   Fidelity mutual funds in taxable accounts; ETFs for tax efficiency; mutual funds in 401k.\n")

        print("6. **Monitoring:**")
        print("   Conservative: quarterly | Moderate: quarterly | Aggressive+: monthly")
        print("   Moonshot: weekly (high volatility)\n")

        print(f"{'='*130}")
        print(f"✅ Report generated {datetime.now().strftime('%I:%M %p EST')}")
        print(f"{'='*130}\n")

if __name__ == "__main__":
    try:
        analyzer = PortfolioAnalyzer()
        analyzer.generate_report()
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        sys.exit(1)
