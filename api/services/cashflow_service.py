"""Cash flow engine — bank statement parsing, income/bill tracking, summaries."""

import csv
import io
import logging
import time
from datetime import datetime, timedelta

from api.models.database import db
from api.services.cashflow_categories import (
    categorize_transaction,
    detect_csv_format,
    parse_csv_row,
)

logger = logging.getLogger(__name__)


def parse_bank_statement(file_content: bytes, filename: str) -> list[dict]:
    """Parse CSV bank statement into normalized transaction dicts."""
    try:
        text = file_content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = file_content.decode("latin-1")

    reader = csv.reader(io.StringIO(text))
    rows = list(reader)

    if len(rows) < 2:
        raise ValueError("CSV file has no data rows")

    headers = rows[0]
    fmt = detect_csv_format(headers)
    normalized = [h.strip().lower().replace(" ", "_") for h in headers]
    transactions: list[dict] = []

    for row in rows[1:]:
        if not row or all(cell.strip() == "" for cell in row):
            continue
        try:
            txn = parse_csv_row(row, normalized, fmt)
            if txn:
                txn["category"] = categorize_transaction(txn["description"])
                txn["source"] = "bank_statement"
                transactions.append(txn)
        except Exception as e:
            logger.debug("Skipping row %s: %s", row, e)
            continue

    logger.info(
        "Parsed %d transactions from %s (%s format)",
        len(transactions), filename, fmt,
    )
    return transactions


def save_transactions(transactions: list[dict]) -> int:
    """Save parsed transactions to the database. Returns count saved."""
    now = time.time()
    count = 0
    for txn in transactions:
        try:
            db.execute(
                "INSERT INTO transactions "
                "(date, description, amount, category, source, created_at) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (
                    txn["date"], txn["description"], txn["amount"],
                    txn.get("category", "Other"),
                    txn.get("source", "bank_statement"), now,
                ),
            )
            count += 1
        except Exception as e:
            logger.error("Failed to save transaction: %s - %s", txn, e)
    db.commit()
    logger.info("Saved %d transactions", count)
    return count


def get_transactions(months: int = 3) -> list[dict]:
    """Retrieve transactions from the last N months."""
    cutoff = (datetime.now() - timedelta(days=months * 30)).strftime("%Y-%m-%d")
    return db.fetchall(
        "SELECT id, date, description, amount, category, source "
        "FROM transactions WHERE date >= ? ORDER BY date DESC",
        (cutoff,),
    )


def add_income(
    source: str, amount: float, frequency: str, is_gross: bool = False,
) -> dict:
    """Add an income source."""
    now = time.time()
    db.execute(
        "INSERT INTO income_sources (source, amount, frequency, is_gross, created_at) "
        "VALUES (?, ?, ?, ?, ?)",
        (source, amount, frequency, int(is_gross), now),
    )
    db.commit()
    row = db.fetchone(
        "SELECT id, source, amount, frequency, is_gross FROM income_sources "
        "WHERE rowid = last_insert_rowid()"
    )
    logger.info("Added income source: %s $%.2f %s", source, amount, frequency)
    return row or {"source": source, "amount": amount, "frequency": frequency}


def get_income_sources() -> list[dict]:
    """Get all income sources."""
    return db.fetchall(
        "SELECT id, source, amount, frequency, is_gross FROM income_sources "
        "ORDER BY amount DESC"
    )


def delete_income(income_id: int) -> bool:
    """Delete an income source by ID."""
    db.execute("DELETE FROM income_sources WHERE id = ?", (income_id,))
    db.commit()
    deleted = db.execute("SELECT changes()").fetchone()[0]
    return deleted > 0


def add_bill(
    name: str, amount: float, due_day: int, category: str,
    auto_pay: bool = False,
) -> dict:
    """Add a recurring bill."""
    if not 1 <= due_day <= 31:
        raise ValueError("due_day must be between 1 and 31")
    now = time.time()
    db.execute(
        "INSERT INTO bills (name, amount, due_day, category, auto_pay, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (name, amount, due_day, category, int(auto_pay), now),
    )
    db.commit()
    row = db.fetchone(
        "SELECT id, name, amount, due_day, category, auto_pay FROM bills "
        "WHERE rowid = last_insert_rowid()"
    )
    logger.info("Added bill: %s $%.2f due day %d", name, amount, due_day)
    return row or {"name": name, "amount": amount, "due_day": due_day}


def get_bills() -> list[dict]:
    """Get all recurring bills."""
    return db.fetchall(
        "SELECT id, name, amount, due_day, category, auto_pay FROM bills "
        "ORDER BY due_day"
    )


def delete_bill(bill_id: int) -> bool:
    """Delete a bill by ID."""
    db.execute("DELETE FROM bills WHERE id = ?", (bill_id,))
    db.commit()
    deleted = db.execute("SELECT changes()").fetchone()[0]
    return deleted > 0


def _monthly_amount(amount: float, frequency: str) -> float:
    """Convert an income amount to its monthly equivalent."""
    freq_map = {
        "weekly": amount * 52 / 12,
        "biweekly": amount * 26 / 12,
        "semi-monthly": amount * 2,
        "monthly": amount,
        "quarterly": amount / 3,
        "annually": amount / 12,
    }
    return freq_map.get(frequency.lower(), amount)


def get_cashflow_summary(months: int = 3) -> dict:
    """Calculate comprehensive cash flow summary over N months."""
    transactions = get_transactions(months)
    income_sources = get_income_sources()
    bills = get_bills()

    monthly_income = sum(
        _monthly_amount(src["amount"], src["frequency"])
        for src in income_sources
    )

    # If no income sources defined, estimate from transaction data
    months_actual = max(months, 1)
    if not income_sources and transactions:
        income_txns = [t for t in transactions if t["amount"] > 0]
        total_income_txn = sum(t["amount"] for t in income_txns)
        monthly_income = total_income_txn / months_actual

    # Spending by category from transactions
    spending_by_category: dict[str, float] = {}
    total_expenses = 0.0
    expense_list: list[dict] = []

    for txn in transactions:
        if txn["amount"] < 0:
            cat = txn["category"]
            abs_amount = abs(txn["amount"])
            spending_by_category[cat] = spending_by_category.get(cat, 0) + abs_amount
            total_expenses += abs_amount
            expense_list.append({
                "name": txn["description"],
                "amount": abs_amount,
                "category": cat,
            })

    monthly_expenses = total_expenses / months_actual
    bills_total = sum(b["amount"] for b in bills)
    top_expenses = sorted(
        expense_list, key=lambda x: x["amount"], reverse=True,
    )[:10]

    avg_spending = {
        cat: round(amt / months_actual, 2)
        for cat, amt in sorted(
            spending_by_category.items(), key=lambda x: x[1], reverse=True,
        )
    }

    monthly_surplus = monthly_income - monthly_expenses
    savings_rate = (
        (monthly_surplus / monthly_income * 100) if monthly_income > 0 else 0.0
    )
    discretionary = monthly_expenses - bills_total

    return {
        "monthly_income": round(monthly_income, 2),
        "monthly_expenses": round(monthly_expenses, 2),
        "monthly_surplus": round(monthly_surplus, 2),
        "savings_rate": round(savings_rate, 2),
        "spending_by_category": avg_spending,
        "top_expenses": top_expenses,
        "income_sources": [
            {"source": s["source"], "amount": s["amount"], "frequency": s["frequency"]}
            for s in income_sources
        ],
        "bills_total": round(bills_total, 2),
        "discretionary_spending": round(max(discretionary, 0), 2),
        "months_analyzed": months_actual,
    }
