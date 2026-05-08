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

import requests
import json
import time

def main(
    client_id: str,
    client_secret: str,
    refresh_token: str,
    tenant_id: str,
) -> dict:
    """
    Exchange a Xero refresh token for a fresh access token.
    Returns the new access_token and its expiry timestamp.
    """
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
    payload = resp.json()

    access_token = payload["access_token"]
    expires_in = payload.get("expires_in", 1800)  # Xero: 30 min
    new_refresh_token = payload.get("refresh_token", refresh_token)
    token_expiry = int(time.time()) + expires_in - 60  # 60s buffer

    # NOTE: persist new_refresh_token back to your KV store here.
    # e.g. requests.put("https://your-kv-store/xero/refresh_token", json={"value": new_refresh_token})

    return {
        "access_token": access_token,
        "tenant_id": tenant_id,
        "token_expiry": token_expiry,
        "new_refresh_token": new_refresh_token,
    }
