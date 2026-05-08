"""
Vellum Code Execution Node: 13-Week Cash Flow Forecast Model
--------------------------------------------------------------
Builds a 13-week rolling cash forecast using:
  - Xero authorised invoices (AR schedule by due date)
  - Xero approved bills (AP schedule by due date)
  - Precoro approved POs (committed spend by expected delivery)
  - Fixed cost schedule (payroll, rent, insurance)
  - Historical payment patterns (collection efficiency by aging bucket)

Inputs:
  - xero_invoices (list)            — Xero /Invoices?where=Status=="AUTHORISED"
  - xero_bills (list)               — Xero /Invoices?where=Type=="ACCPAY"
  - precoro_purchase_orders (list)  — Precoro approved POs
  - cash_position (float)           — Current bank balance
  - fixed_costs_weekly (float)      — Weekly fixed cost estimate (payroll, rent, etc.)
  - collection_efficiency (float)   — % of AR collected on time (default 0.85)

Outputs:
  - forecast_weeks (list of dicts)  — 13-week cash position schedule
  - min_projected (float)           — lowest projected cash over period
  - min_week (int)                  — week number of the minimum
  - end_position (float)            — projected cash at week 13
  - risk_weeks (list)               — weeks where cash < working_capital_minimum
"""

from datetime import date, timedelta
from typing import Any
from collections import defaultdict


WORKING_CAPITAL_MINIMUM = 1_500_000  # Flag weeks below this
CRITICAL_THRESHOLD = 500_000         # Alert if projected < this


def _parse_amount(val: Any) -> float:
    try:
        return float(str(val).replace(",", ""))
    except (TypeError, ValueError):
        return 0.0


def _week_offset(due_date_str: str, today: date) -> int:
    """Return how many weeks from today an item falls in (0 = current week)."""
    try:
        due = date.fromisoformat(due_date_str[:10])
        delta = (due - today).days
        return max(0, min(13, delta // 7))
    except (TypeError, ValueError):
        return 0  # Default to current week if unparseable


def _schedule_invoices(
    invoices: list,
    today: date,
    collection_efficiency: float,
    weeks: int = 14,
) -> dict[int, float]:
    """
    Distribute AR inflows across weeks based on invoice due dates.
    Applies collection efficiency discount to model late payments.
    """
    schedule: dict[int, float] = defaultdict(float)
    for inv in invoices:
        amount_due = _parse_amount(inv.get("AmountDue") or inv.get("amountDue") or 0)
        if amount_due <= 0:
            continue
        due_str = inv.get("DueDate") or inv.get("dueDate") or ""
        wk = _week_offset(due_str, today)
        schedule[wk] += amount_due * collection_efficiency
    return dict(schedule)


def _schedule_bills(bills: list, today: date, weeks: int = 14) -> dict[int, float]:
    """Distribute AP outflows across weeks based on bill due dates."""
    schedule: dict[int, float] = defaultdict(float)
    for bill in bills:
        amount_due = _parse_amount(bill.get("AmountDue") or bill.get("amountDue") or 0)
        if amount_due <= 0:
            continue
        due_str = bill.get("DueDate") or bill.get("dueDate") or ""
        wk = _week_offset(due_str, today)
        schedule[wk] += amount_due
    return dict(schedule)


def _schedule_pos(pos: list, today: date, weeks: int = 14) -> dict[int, float]:
    """Distribute committed PO outflows by expected delivery date."""
    schedule: dict[int, float] = defaultdict(float)
    for po in pos:
        status = po.get("status", "").lower()
        if status not in ("approved", "ordered", "partial"):
            continue
        amount = _parse_amount(po.get("totalAmount") or po.get("total") or 0)
        invoiced = _parse_amount(po.get("invoicedAmount") or po.get("billed") or 0)
        outstanding = max(amount - invoiced, 0)
        if outstanding <= 0:
            continue
        delivery_str = po.get("expectedDeliveryDate") or po.get("deliveryDate") or ""
        wk = _week_offset(delivery_str, today)
        schedule[wk] += outstanding
    return dict(schedule)


def main(
    xero_invoices: list,
    xero_bills: list,
    precoro_purchase_orders: list,
    cash_position: float,
    fixed_costs_weekly: float = 50_000.0,
    collection_efficiency: float = 0.85,
    working_capital_minimum: float = WORKING_CAPITAL_MINIMUM,
) -> dict:
    today = date.today()
    weeks = 13

    ar_schedule = _schedule_invoices(xero_invoices, today, collection_efficiency)
    ap_schedule = _schedule_bills(xero_bills, today)
    po_schedule = _schedule_pos(precoro_purchase_orders, today)

    forecast_weeks = []
    running_cash = cash_position
    risk_weeks = []
    critical_weeks = []

    for wk in range(weeks + 1):
        week_start = today + timedelta(weeks=wk)
        ar_inflow = ar_schedule.get(wk, 0.0)
        ap_outflow = ap_schedule.get(wk, 0.0)
        po_outflow = po_schedule.get(wk, 0.0)
        fixed = fixed_costs_weekly if wk > 0 else 0.0

        if wk > 0:
            running_cash += ar_inflow - ap_outflow - po_outflow - fixed

        week_data = {
            "week": wk,
            "week_start": week_start.isoformat(),
            "label": f"Wk {wk}" if wk > 0 else "Now",
            "projected_cash": round(running_cash, 2),
            "ar_inflow": round(ar_inflow, 2),
            "ap_outflow": round(ap_outflow, 2),
            "po_outflow": round(po_outflow, 2),
            "fixed_costs": round(fixed, 2),
            "net_movement": round(ar_inflow - ap_outflow - po_outflow - fixed, 2) if wk > 0 else 0,
            "below_working_capital": running_cash < working_capital_minimum,
            "below_critical": running_cash < CRITICAL_THRESHOLD,
        }
        forecast_weeks.append(week_data)

        if running_cash < working_capital_minimum:
            risk_weeks.append(wk)
        if running_cash < CRITICAL_THRESHOLD:
            critical_weeks.append(wk)

    projected_values = [w["projected_cash"] for w in forecast_weeks]
    min_projected = min(projected_values)
    min_week = projected_values.index(min_projected)
    max_projected = max(projected_values)
    max_week = projected_values.index(max_projected)

    return {
        "forecast_weeks": forecast_weeks,
        "min_projected": round(min_projected, 2),
        "min_week": min_week,
        "max_projected": round(max_projected, 2),
        "max_week": max_week,
        "end_position": round(forecast_weeks[-1]["projected_cash"], 2),
        "risk_weeks": risk_weeks,
        "critical_weeks": critical_weeks,
        "has_critical_risk": len(critical_weeks) > 0,
        "has_working_capital_risk": len(risk_weeks) > 0,
    }
