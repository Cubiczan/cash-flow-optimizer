"""
Vellum Code Execution Node: Xero Token Refresh
-----------------------------------------------
Called before every Xero API request. Handles OAuth 2.0
token expiry (30-min window) using a stored refresh token.

Inputs (from Vellum Secrets):
  - XERO_CLIENT_ID
  - XERO_CLIENT_SECRET
  - XERO_REFRESH_TOKEN  (stored in external KV / Vellum Secret)
  - XERO_TENANT_ID

Outputs:
  - access_token (str)
  - token_expiry (int)  — unix epoch when this token expires
"""

import os
import requests
import json
import time

from cubiczan_resilience import resilient


# Xero's token endpoint and the KV store are both external network hops. Wrap
# each in @resilient so transient failures (DNS blips, 5xx, read timeouts) are
# retried with exponential backoff + jitter and bounded by a hard timeout +
# circuit-breaker, rather than failing the whole Vellum workflow on the first
# flaky request. max_attempts=3 per the audit; the timeout guards a single try.
@resilient(timeout=10, max_attempts=3)
def _exchange_refresh_token(
    client_id: str,
    client_secret: str,
    refresh_token: str,
) -> requests.Response:
    """POST to Xero's identity endpoint to swap a refresh token for an access token."""
    resp = requests.post(
        "https://identity.xero.com/connect/token",
        data={
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": client_id,
            "client_secret": client_secret,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=10,
    )
    resp.raise_for_status()
    return resp


@resilient(timeout=10, max_attempts=3)
def _persist_refresh_token(kv_url: str, kv_token: str, new_refresh_token: str) -> None:
    """PUT the rotated refresh token to the external KV store, with retry."""
    kv_resp = requests.put(
        f"{kv_url.rstrip('/')}/xero/refresh_token",
        json={"value": new_refresh_token},
        headers={"Authorization": f"Bearer {kv_token}"},
        timeout=10,
    )
    # Raise on failure so the caller (and retry layer) sees it instead of
    # discarding the only valid refresh token.
    kv_resp.raise_for_status()


def main(
    client_id: str,
    client_secret: str,
    refresh_token: str,
    tenant_id: str,
) -> dict:
    """
    Exchange a Xero refresh token for a fresh access token.
    Returns the new access_token and its expiry timestamp.

    On unrecoverable failure (all retries exhausted, timeout, or missing KV
    config) this returns a structured error dict instead of raising, so the
    downstream Vellum Guardrail Node can route to an alert path rather than the
    workflow crashing silently.
    """
    try:
        resp = _exchange_refresh_token(client_id, client_secret, refresh_token)
    except Exception as e:  # retries exhausted / timeout / circuit open
        return {
            "error": True,
            "stage": "token_exchange",
            "message": f"Failed to refresh Xero access token: {e}",
            "access_token": None,
            "tenant_id": tenant_id,
        }

    payload = resp.json()

    access_token = payload["access_token"]
    expires_in = payload.get("expires_in", 1800)  # Xero: 30 min
    new_refresh_token = payload.get("refresh_token", refresh_token)
    token_expiry = int(time.time()) + expires_in - 60  # 60s buffer

    # Persist the rotated refresh token back to the KV store IMMEDIATELY.
    # Xero rotates the refresh token on every exchange; the previous token is
    # now invalid. If we fail to persist the new one, the next workflow run
    # will lose Xero access permanently. Persist only when the token actually
    # changed, and surface failure as a structured error rather than silently
    # dropping it.
    if new_refresh_token != refresh_token:
        kv_url = os.environ.get("KV_STORE_URL")
        kv_token = os.environ.get("KV_STORE_TOKEN")
        if not kv_url or not kv_token:
            return {
                "error": True,
                "stage": "token_persist",
                "message": (
                    "Xero rotated the refresh token but KV_STORE_URL / "
                    "KV_STORE_TOKEN are not configured; cannot persist the new "
                    "token. Aborting to avoid silently losing Xero access."
                ),
                "access_token": None,
                "tenant_id": tenant_id,
            }
        try:
            _persist_refresh_token(kv_url, kv_token, new_refresh_token)
        except Exception as e:  # retries exhausted / timeout / circuit open
            return {
                "error": True,
                "stage": "token_persist",
                "message": (
                    f"Refreshed Xero token but failed to persist the rotated "
                    f"refresh token to the KV store: {e}. The next run may lose "
                    f"Xero access."
                ),
                "access_token": None,
                "tenant_id": tenant_id,
            }

    return {
        "error": False,
        "access_token": access_token,
        "tenant_id": tenant_id,
        "token_expiry": token_expiry,
        "new_refresh_token": new_refresh_token,
    }
