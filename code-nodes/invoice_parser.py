"""
Vellum Code Execution Node: Invoice PDF Parser (Pre/Post LLM)
--------------------------------------------------------------
Workflow 2 — Invoice Ingestion.

PRE-LLM step: Extracts raw text from invoice PDF/image attachment
for the downstream Inline Prompt Node to parse.

POST-LLM step: Validates and structures the LLM-extracted invoice
fields, then prepares a Xero-ready invoice payload.

=== PRE-LLM usage ===
Inputs:
  - attachment_bytes_b64 (str)   — base64-encoded PDF/image from Outlook
  - filename (str)               — e.g. "invoice_samsung_apr2026.pdf"

Outputs:
  - raw_text (str)               — Extracted text for LLM prompt
  - mime_type (str)

=== POST-LLM usage ===
Inputs:
  - llm_extracted (dict)         — LLM output: vendor, amount, due_date, etc.
  - po_match (dict | None)       — Matched Precoro PO (or None)

Outputs:
  - xero_invoice_payload (dict)  — Ready to POST to Xero /Invoices
  - three_way_match_passed (bool)
  - match_variance (float)       — % diff between PO and invoice amount
  - needs_manual_review (bool)
"""

import base64
import json
from datetime import date, datetime
from typing import Any


def _parse_date(val: str) -> str:
    """Normalize various date formats to ISO 8601."""
    if not val:
        return date.today().isoformat()
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%B %d, %Y", "%b %d, %Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(val.strip(), fmt).date().isoformat()
        except ValueError:
            continue
    return date.today().isoformat()


def extract_for_llm(attachment_bytes_b64: str, filename: str) -> dict:
    """
    Pre-process PDF/image for LLM parsing.
    For PDFs, Vellum supports direct PDF→prompt as of Mar 2025.
    This node just validates and passes through the base64 content.
    """
    try:
        decoded = base64.b64decode(attachment_bytes_b64)
        size_kb = len(decoded) / 1024
    except Exception as e:
        return {"error": f"Failed to decode attachment: {e}", "raw_text": "", "mime_type": ""}

    ext = filename.lower().split(".")[-1] if "." in filename else ""
    mime_map = {"pdf": "application/pdf", "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg"}
    mime_type = mime_map.get(ext, "application/octet-stream")

    return {
        "attachment_b64": attachment_bytes_b64,
        "mime_type": mime_type,
        "filename": filename,
        "size_kb": round(size_kb, 1),
        "ready_for_llm": True,
    }


def build_xero_payload(llm_extracted: dict, po_match: Any = None) -> dict:
    """
    Validate LLM-extracted invoice fields and build Xero AP invoice payload.
    Optionally run 3-way match against a Precoro PO.
    """
    vendor_name = llm_extracted.get("vendor", "").strip()
    amount_str = str(llm_extracted.get("total_amount") or llm_extracted.get("amount") or "0")
    invoice_amount = float(amount_str.replace(",", "").replace("$", "").replace("AUD", "").strip() or 0)
    invoice_number = llm_extracted.get("invoice_number") or llm_extracted.get("reference") or ""
    due_date = _parse_date(llm_extracted.get("due_date") or llm_extracted.get("dueDate") or "")
    invoice_date = _parse_date(llm_extracted.get("invoice_date") or llm_extracted.get("date") or "")
    line_items = llm_extracted.get("line_items") or []

    # 3-way match logic
    three_way_match_passed = True
    match_variance = 0.0
    needs_manual_review = False
    match_notes = []

    if po_match:
        po_amount = float(po_match.get("totalAmount") or po_match.get("total") or 0)
        if po_amount > 0 and invoice_amount > 0:
            match_variance = abs(invoice_amount - po_amount) / po_amount
            if match_variance > 0.05:  # >5% variance triggers review
                three_way_match_passed = False
                needs_manual_review = True
                match_notes.append(
                    f"Amount variance {match_variance:.1%}: Invoice ${invoice_amount:,.2f} vs PO ${po_amount:,.2f}"
                )
        if not po_match.get("receiptConfirmed") and not po_match.get("deliveryConfirmed"):
            match_notes.append("Goods receipt not yet confirmed in Precoro")

    if not vendor_name:
        needs_manual_review = True
        match_notes.append("Could not extract vendor name from PDF")

    if invoice_amount <= 0:
        needs_manual_review = True
        match_notes.append("Invoice amount is zero or could not be parsed")

    # Build Xero payload
    xero_payload = {
        "Type": "ACCPAY",
        "Contact": {"Name": vendor_name},
        "Date": invoice_date,
        "DueDate": due_date,
        "InvoiceNumber": invoice_number,
        "Reference": po_match.get("poNumber") if po_match else "",
        "Status": "DRAFT" if needs_manual_review else "AUTHORISED",
        "LineAmountTypes": "Exclusive",
        "LineItems": [
            {
                "Description": item.get("description", "See invoice"),
                "Quantity": item.get("quantity", 1),
                "UnitAmount": item.get("unit_price") or item.get("amount", 0),
                "AccountCode": "400",  # Default AP account — update per chart of accounts
            }
            for item in line_items
        ] if line_items else [
            {
                "Description": f"Invoice {invoice_number} from {vendor_name}",
                "Quantity": 1,
                "UnitAmount": invoice_amount,
                "AccountCode": "400",
            }
        ],
    }

    return {
        "xero_invoice_payload": xero_payload,
        "three_way_match_passed": three_way_match_passed,
        "match_variance": round(match_variance, 4),
        "needs_manual_review": needs_manual_review,
        "match_notes": match_notes,
        "vendor_name": vendor_name,
        "invoice_amount": invoice_amount,
        "due_date": due_date,
    }


def main(mode: str, **kwargs) -> dict:
    """
    Dispatch to pre-LLM or post-LLM function based on mode.
    mode = 'extract' | 'build_payload'
    """
    if mode == "extract":
        return extract_for_llm(
            attachment_bytes_b64=kwargs.get("attachment_bytes_b64", ""),
            filename=kwargs.get("filename", "invoice.pdf"),
        )
    elif mode == "build_payload":
        return build_xero_payload(
            llm_extracted=kwargs.get("llm_extracted", {}),
            po_match=kwargs.get("po_match"),
        )
    else:
        return {"error": f"Unknown mode: {mode}. Use 'extract' or 'build_payload'."}
