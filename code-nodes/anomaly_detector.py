"""
Vellum Code Execution Node: Anomaly Detector
----------------------------------------------
Replaces Syft Analytics anomaly detection.
Detects unusual transactions, AR/AP movements, and cash variances
using Z-score analysis against a rolling 90-day baseline.

Inputs:
  - transactions (list)          — Xero bank transactions (last 90 days)
  - current_ar_total (float)     — Today's AR total
  - current_ap_total (float)     — Today's AP total
  - historical_snapshots (list)  — Prior daily snapshots from Document Index/DB

Outputs:
  - anomalies (list)             — Detected anomalies with severity and description
  - anomaly_count (int)
  - highest_severity (str)       — 'critical' | 'warning' | 'info' | 'none'
"""

import statistics
from typing import Any


def _parse_amount(val: Any) -> float:
    try:
        return float(str(val).replace(",", ""))
    except (TypeError, ValueError):
        return 0.0


def _z_score(value: float, mean: float, std: float) -> float:
    if std == 0:
        return 0.0
    return abs((value - mean) / std)


def _classify_severity(z: float) -> str:
    if z >= 3.0:
        return "critical"
    if z >= 2.0:
        return "warning"
    if z >= 1.5:
        return "info"
    return "none"


def _detect_transaction_anomalies(transactions: list) -> list:
    """Flag individual transactions with unusually large amounts."""
    amounts = [_parse_amount(t.get("Total") or t.get("amount") or 0) for t in transactions]
    if len(amounts) < 10:
        return []

    mean = statistics.mean(amounts)
    std = statistics.stdev(amounts)
    anomalies = []

    for txn in transactions[-30:]:  # Only check last 30 days
        amount = _parse_amount(txn.get("Total") or txn.get("amount") or 0)
        z = _z_score(amount, mean, std)
        severity = _classify_severity(z)
        if severity != "none":
            desc = txn.get("Description") or txn.get("reference") or "Unknown transaction"
            txn_date = txn.get("Date") or txn.get("date") or "Unknown date"
            anomalies.append({
                "type": "transaction",
                "severity": severity,
                "description": f"Unusual transaction: {desc} (${amount:,.0f}) on {txn_date}",
                "z_score": round(z, 2),
                "amount": amount,
            })

    return anomalies


def _detect_balance_variance(current_ar: float, current_ap: float, snapshots: list) -> list:
    """Compare current AR/AP totals against 30-day rolling average."""
    if len(snapshots) < 7:
        return []

    historical_ar = [_parse_amount(s.get("ar_total") or s.get("arTotal") or 0) for s in snapshots[-30:]]
    historical_ap = [_parse_amount(s.get("ap_total") or s.get("apTotal") or 0) for s in snapshots[-30:]]

    anomalies = []

    if len(historical_ar) >= 7:
        ar_mean = statistics.mean(historical_ar)
        ar_std = statistics.stdev(historical_ar) if len(historical_ar) > 1 else 1
        ar_z = _z_score(current_ar, ar_mean, ar_std)
        severity = _classify_severity(ar_z)
        if severity != "none":
            direction = "spike" if current_ar > ar_mean else "drop"
            anomalies.append({
                "type": "ar_variance",
                "severity": severity,
                "description": f"AR total {direction}: ${current_ar:,.0f} vs 30-day avg ${ar_mean:,.0f}",
                "z_score": round(ar_z, 2),
                "current_value": current_ar,
                "baseline_mean": round(ar_mean, 2),
            })

    if len(historical_ap) >= 7:
        ap_mean = statistics.mean(historical_ap)
        ap_std = statistics.stdev(historical_ap) if len(historical_ap) > 1 else 1
        ap_z = _z_score(current_ap, ap_mean, ap_std)
        severity = _classify_severity(ap_z)
        if severity != "none":
            direction = "spike" if current_ap > ap_mean else "drop"
            anomalies.append({
                "type": "ap_variance",
                "severity": severity,
                "description": f"AP total {direction}: ${current_ap:,.0f} vs 30-day avg ${ap_mean:,.0f}",
                "z_score": round(ap_z, 2),
                "current_value": current_ap,
                "baseline_mean": round(ap_mean, 2),
            })

    return anomalies


def main(
    transactions: list,
    current_ar_total: float,
    current_ap_total: float,
    historical_snapshots: list,
) -> dict:
    anomalies: list = []

    txn_anomalies = _detect_transaction_anomalies(transactions)
    anomalies.extend(txn_anomalies)

    balance_anomalies = _detect_balance_variance(current_ar_total, current_ap_total, historical_snapshots)
    anomalies.extend(balance_anomalies)

    # Sort by severity
    severity_order = {"critical": 0, "warning": 1, "info": 2}
    anomalies.sort(key=lambda a: severity_order.get(a["severity"], 3))

    highest_severity = anomalies[0]["severity"] if anomalies else "none"

    return {
        "anomalies": anomalies,
        "anomaly_count": len(anomalies),
        "highest_severity": highest_severity,
        "has_critical": any(a["severity"] == "critical" for a in anomalies),
    }
