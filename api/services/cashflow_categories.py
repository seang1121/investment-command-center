"""Transaction category keywords and classification helpers."""

import csv
import io
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Keyword-to-category mapping for auto-categorization
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "Housing": [
        "rent", "mortgage", "hoa", "property tax", "homeowner",
        "apartment", "lease", "landlord", "realty",
    ],
    "Transportation": [
        "gas", "fuel", "uber", "lyft", "parking", "toll", "auto",
        "car wash", "oil change", "tire", "vehicle", "transit", "metro",
    ],
    "Food & Dining": [
        "restaurant", "doordash", "grubhub", "uber eats", "mcdonald",
        "starbucks", "chipotle", "pizza", "cafe", "diner", "taco",
        "burger", "subway", "panera", "chick-fil-a", "wendy",
    ],
    "Utilities": [
        "electric", "water", "gas bill", "internet", "comcast", "verizon",
        "at&t", "t-mobile", "sprint", "xfinity", "spectrum", "utility",
        "sewer", "trash", "waste",
    ],
    "Insurance": [
        "insurance", "geico", "state farm", "allstate", "progressive",
        "liberty mutual", "premium", "policy",
    ],
    "Healthcare": [
        "pharmacy", "cvs", "walgreens", "doctor", "hospital", "medical",
        "dental", "vision", "health", "urgent care", "lab",
    ],
    "Entertainment": [
        "netflix", "spotify", "hulu", "disney", "hbo", "youtube",
        "movie", "theater", "concert", "gaming", "steam", "playstation",
        "xbox", "twitch", "apple music", "amazon prime",
    ],
    "Shopping": [
        "amazon", "walmart", "target", "costco", "best buy", "home depot",
        "lowes", "ikea", "etsy", "ebay", "shop", "store", "mall",
    ],
    "Personal": [
        "gym", "fitness", "salon", "barber", "spa", "dry clean",
        "laundry", "subscription",
    ],
    "Savings": [
        "transfer to savings", "investment", "brokerage", "401k", "ira",
        "roth", "deposit to savings", "vanguard", "fidelity", "schwab",
    ],
    "Debt Payments": [
        "loan payment", "student loan", "credit card payment", "car payment",
        "mortgage payment", "debt", "interest charge", "finance charge",
    ],
    "Income": [
        "payroll", "direct deposit", "salary", "wage", "paycheck",
        "income", "dividend", "refund", "reimbursement", "deposit",
    ],
    "Groceries": [
        "grocery", "whole foods", "trader joe", "aldi", "kroger",
        "safeway", "publix", "wegmans", "sprouts", "food lion",
    ],
}


def categorize_transaction(description: str) -> str:
    """Auto-categorize a transaction based on description keywords."""
    desc_lower = description.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in desc_lower:
                return category
    return "Other"


def detect_csv_format(headers: list[str]) -> str:
    """Detect bank statement CSV format from headers."""
    normalized = [h.strip().lower() for h in headers]
    joined = ",".join(normalized)
    if "post date" in joined and "type" in joined:
        return "chase"
    if "running bal" in joined:
        return "bofa"
    return "generic"


def parse_amount(value: str) -> float:
    """Parse an amount string, stripping $ and commas."""
    cleaned = value.strip().replace("$", "").replace(",", "")
    if not cleaned or cleaned == "-":
        return 0.0
    return float(cleaned)


def parse_date(value: str) -> str:
    """Parse a date string into YYYY-MM-DD format."""
    value = value.strip()
    for fmt in ("%m/%d/%Y", "%m/%d/%y", "%Y-%m-%d", "%m-%d-%Y", "%m-%d-%y"):
        try:
            return datetime.strptime(value, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    logger.warning("Could not parse date: %s", value)
    return value


def parse_csv_row(row: list[str], headers: list[str], fmt: str) -> dict | None:
    """Parse a single CSV row based on detected format."""
    col_map = {h: i for i, h in enumerate(headers)}

    if fmt == "chase":
        date_col = col_map.get("transaction_date", col_map.get("posting_date", 0))
        desc_col = col_map.get("description", 2)
        amt_col = col_map.get("amount", 5)
        return {
            "date": parse_date(row[date_col]),
            "description": row[desc_col].strip(),
            "amount": parse_amount(row[amt_col]),
        }

    if fmt == "bofa":
        date_col = col_map.get("date", 0)
        desc_col = col_map.get("description", 1)
        amt_col = col_map.get("amount", 2)
        return {
            "date": parse_date(row[date_col]),
            "description": row[desc_col].strip(),
            "amount": parse_amount(row[amt_col]),
        }

    # Generic: find date, description, amount columns
    date_val, desc_val, amount_val = None, None, None
    debit_val, credit_val = None, None

    for i, h in enumerate(headers):
        if i >= len(row):
            break
        if "date" in h and date_val is None:
            date_val = row[i]
        elif "desc" in h or "memo" in h or "narr" in h:
            desc_val = row[i]
        elif h == "amount":
            amount_val = row[i]
        elif "debit" in h:
            debit_val = row[i]
        elif "credit" in h:
            credit_val = row[i]

    if date_val is None or desc_val is None:
        return None

    if amount_val is not None:
        amount = parse_amount(amount_val)
    elif debit_val is not None or credit_val is not None:
        debit = parse_amount(debit_val) if debit_val else 0.0
        credit = parse_amount(credit_val) if credit_val else 0.0
        amount = credit - debit if credit else -debit
    else:
        return None

    return {
        "date": parse_date(date_val),
        "description": desc_val.strip(),
        "amount": amount,
    }
