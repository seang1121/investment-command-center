"""Net worth tracker — assets, liabilities, snapshots."""

import logging
import time

from api.models.database import db

logger = logging.getLogger(__name__)

ASSET_CATEGORIES = [
    "Cash & Savings",
    "Investments",
    "Real Estate",
    "Vehicles",
    "Personal Property",
    "Other",
]

LIABILITY_CATEGORIES = [
    "Mortgage",
    "Student Loans",
    "Auto Loans",
    "Credit Cards",
    "Personal Loans",
    "Medical Debt",
    "Other",
]


def add_asset(name: str, value: float, category: str) -> dict:
    """Add a new asset entry."""
    if category not in ASSET_CATEGORIES:
        category = "Other"
    now = time.time()
    cursor = db.execute(
        "INSERT INTO assets (name, value, category, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        (name, value, category, now, now),
    )
    db.commit()
    return {
        "id": cursor.lastrowid,
        "name": name,
        "value": value,
        "category": category,
    }


def add_liability(
    name: str,
    balance: float,
    category: str,
    interest_rate: float = 0,
    min_payment: float = 0,
) -> dict:
    """Add a new liability entry."""
    if category not in LIABILITY_CATEGORIES:
        category = "Other"
    now = time.time()
    cursor = db.execute(
        "INSERT INTO liabilities "
        "(name, balance, category, interest_rate, min_payment, "
        "created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (name, balance, category, interest_rate, min_payment, now, now),
    )
    db.commit()
    return {
        "id": cursor.lastrowid,
        "name": name,
        "balance": balance,
        "category": category,
        "interest_rate": interest_rate,
        "min_payment": min_payment,
    }


def get_assets() -> list[dict]:
    """Get all assets."""
    return db.fetchall("SELECT * FROM assets ORDER BY category, name")


def get_liabilities() -> list[dict]:
    """Get all liabilities."""
    return db.fetchall(
        "SELECT * FROM liabilities ORDER BY category, name"
    )


def delete_asset(asset_id: int) -> bool:
    """Delete an asset by ID."""
    db.execute("DELETE FROM assets WHERE id = ?", (asset_id,))
    db.commit()
    return True


def delete_liability(liability_id: int) -> bool:
    """Delete a liability by ID."""
    db.execute("DELETE FROM liabilities WHERE id = ?", (liability_id,))
    db.commit()
    return True


def get_net_worth_summary() -> dict:
    """Calculate full net worth summary with breakdowns."""
    assets = get_assets()
    liabilities = get_liabilities()

    total_assets = sum(a["value"] for a in assets)
    total_liabilities = sum(li["balance"] for li in liabilities)
    net_worth = total_assets - total_liabilities

    assets_by_category: dict[str, float] = {}
    for a in assets:
        cat = a["category"]
        assets_by_category[cat] = assets_by_category.get(cat, 0) + a["value"]

    liabilities_by_category: dict[str, float] = {}
    for li in liabilities:
        cat = li["category"]
        liabilities_by_category[cat] = (
            liabilities_by_category.get(cat, 0) + li["balance"]
        )

    return {
        "total_assets": round(total_assets, 2),
        "total_liabilities": round(total_liabilities, 2),
        "net_worth": round(net_worth, 2),
        "assets_by_category": assets_by_category,
        "liabilities_by_category": liabilities_by_category,
        "debt_to_income_ratio": None,
        "assets": assets,
        "liabilities": liabilities,
    }


def save_snapshot() -> dict:
    """Save a point-in-time net worth snapshot."""
    summary = get_net_worth_summary()
    now = time.time()
    db.execute(
        "INSERT INTO net_worth_snapshots "
        "(total_assets, total_liabilities, net_worth, snapshot_at) "
        "VALUES (?, ?, ?, ?)",
        (
            summary["total_assets"],
            summary["total_liabilities"],
            summary["net_worth"],
            now,
        ),
    )
    db.commit()
    return {
        "total_assets": summary["total_assets"],
        "total_liabilities": summary["total_liabilities"],
        "net_worth": summary["net_worth"],
        "snapshot_at": now,
    }


def get_net_worth_history(months: int = 12) -> list[dict]:
    """Get historical net worth snapshots."""
    cutoff = time.time() - (months * 30 * 24 * 3600)
    return db.fetchall(
        "SELECT total_assets, total_liabilities, net_worth, snapshot_at "
        "FROM net_worth_snapshots WHERE snapshot_at >= ? "
        "ORDER BY snapshot_at ASC",
        (cutoff,),
    )
