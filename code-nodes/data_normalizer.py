"""
Vellum Code Execution Node: Data Normalizer
--------------------------------------------
Takes raw API responses from Xero and Precoro and
normalizes them into a unified cash flow schema for
the downstream Agent Node.

Inputs:
  - xero_bank_summary (dict)        — Xero /Reports/BankSummary
  - xero_ar_aging (dict)            — Xero /Reports/AgedReceivablesByContact
  - xero_ap_aging (dict)            — Xero /Reports/AgedPayablesByContact
  - precoro_purchase_orders (list)  — Precoro /purchaseorders

Outputs:
  - cash_position (float)
  - ar_total (float)
  - ap_total (float)
  - committed_pos (float)
  - net_position (float)
  - ar_aging_buckets (dict)
  - ap_aging_buckets (dict)
  - summary_text (str)
"""

from datetime import datetime, date
from typing import Any


def _parse_xero_amount(value: Any) -> float:
    """Safely parse Xero API amount values."""
    try:
        return float(str(value).replace(",", ""))
    except (TypeError, ValueError):
        return 0.0


def _extract_bank_balance(bank_summary: dict) -> float:
    """Extract current bank balance from Xero BankSummary report."""
    try:
        rows = bank_summary.get("Reports", [{}])[0].get("Rows", [])
        for row in rows:
            if row.get("RowType") == "SummaryRow":
                cells = row.get("Cells", [])
                if cells:
                    return _parse_xero_amount(cells[-1].get("Value", 0))
    except (IndexError, KeyError):
        pass
    return 0.0


def _extract_aging_buckets(aging_report: dict) -> dict:
    """
    Extract aging buckets from Xero AgedReceivables/AgedPayables report.
    Returns: { contact: { current, days_1_30, days_31_60, days_61_90, days_90plus, total } }
    """
    buckets: dict = {}
    try:
        rows = aging_report.get("Reports", [{}])[0].get("Rows", [])
        for section in rows:
            if section.get("RowType") != "Section":
                continue
            for row in section.get("Rows", []):
                if row.get("RowType") != "Row":
                    continue
                cells = row.get("Cells", [])
                if len(cells) >= 7:
                    contact = cells[0].get("Value", "Unknown")
                    buckets[contact] = {
                        "current":    _parse_xero_amount(cells[1].get("Value", 0)),
                        "days_1_30":  _parse_xero_amount(cells[2].get("Value", 0)),
                        "days_31_60": _parse_xero_amount(cells[3].get("Value", 0)),
                        "days_61_90": _parse_xero_amount(cells[4].get("Value", 0)),
                        "days_90plus":_parse_xero_amount(cells[5].get("Value", 0)),
                        "total":      _parse_xero_amount(cells[6].get("Value", 0)),
                    }
    except (IndexError, KeyError):
        pass
    return buckets


def _sum_aging(buckets: dict) -> float:
    return sum(v["total"] for v in buckets.values())


def _extract_committed_pos(purchase_orders: list) -> float:
    """Sum value of approved POs not yet fully invoiced."""
    total = 0.0
    for po in purchase_orders:
        status = po.get("status", "").lower()
        if status in ("approved", "ordered", "partial"):
            amount = _parse_xero_amount(po.get("totalAmount") or po.get("total") or 0)
            invoiced = _parse_xero_amount(po.get("invoicedAmount") or po.get("billed") or 0)
            total += max(amount - invoiced, 0)
    return total


def main(
    xero_bank_summary: dict,
    xero_ar_aging: dict,
    xero_ap_aging: dict,
    precoro_purchase_orders: list,
) -> dict:
    cash_position = _extract_bank_balance(xero_bank_summary)
    ar_buckets = _extract_aging_buckets(xero_ar_aging)
    ap_buckets = _extract_aging_buckets(xero_ap_aging)
    ar_total = _sum_aging(ar_buckets)
    ap_total = _sum_aging(ap_buckets)
    committed_pos = _extract_committed_pos(precoro_purchase_orders)

    # Net position: cash on hand + collectible AR - due AP - committed POs
    net_position = cash_position + ar_total - ap_total - committed_pos

    # Identify overdue AR (>30 days)
    ar_overdue = sum(
        v["days_31_60"] + v["days_61_90"] + v["days_90plus"]
        for v in ar_buckets.values()
    )
    ar_60plus = sum(
        v["days_61_90"] + v["days_90plus"]
        for v in ar_buckets.values()
    )

    summary_text = (
        f"Cash position as of {date.today():%d %b %Y}:\n"
        f"  Cash balance:    ${cash_position:,.0f}\n"
        f"  Accounts Receivable: ${ar_total:,.0f}  (${ar_60plus:,.0f} overdue >60 days)\n"
        f"  Accounts Payable:    ${ap_total:,.0f}\n"
        f"  Committed POs:       ${committed_pos:,.0f}\n"
        f"  Net position:        ${net_position:,.0f}\n"
    )

    return {
        "cash_position": round(cash_position, 2),
        "ar_total": round(ar_total, 2),
        "ap_total": round(ap_total, 2),
        "committed_pos": round(committed_pos, 2),
        "net_position": round(net_position, 2),
        "ar_overdue_30plus": round(ar_overdue, 2),
        "ar_overdue_60plus": round(ar_60plus, 2),
        "ar_aging_buckets": ar_buckets,
        "ap_aging_buckets": ap_buckets,
        "summary_text": summary_text,
        "snapshot_date": date.today().isoformat(),
    }
