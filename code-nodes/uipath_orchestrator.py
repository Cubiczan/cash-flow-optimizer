"""UiPath Orchestrator helper for Outlook and OneDrive automation."""

from __future__ import annotations

from dataclasses import dataclass
import json
import os
from typing import Any, Sequence

import requests


DEFAULT_BASE_URL = "https://cloud.uipath.com"
DEFAULT_SCOPE = "OR.Default OR.Jobs"
TOKEN_URL = "https://cloud.uipath.com/identity_/connect/token"


@dataclass(slots=True)
class UiPathConfig:
    client_id: str
    client_secret: str
    organization_name: str
    tenant_name: str
    release_key: str | None = None
    folder_key: str | None = None
    base_url: str = DEFAULT_BASE_URL
    scope: str = DEFAULT_SCOPE


class UiPathError(RuntimeError):
    """Raised when UiPath token exchange or job launch fails."""


def config_from_env() -> UiPathConfig | None:
    """Build a UiPath config from environment variables when fully configured."""

    client_id = os.getenv("UIPATH_CLIENT_ID")
    client_secret = os.getenv("UIPATH_CLIENT_SECRET")
    organization_name = os.getenv("UIPATH_ORGANIZATION_NAME")
    tenant_name = os.getenv("UIPATH_TENANT_NAME")

    if not client_id or not client_secret or not organization_name or not tenant_name:
        return None

    return UiPathConfig(
        client_id=client_id,
        client_secret=client_secret,
        organization_name=organization_name,
        tenant_name=tenant_name,
        release_key=os.getenv("UIPATH_RELEASE_KEY"),
        folder_key=os.getenv("UIPATH_FOLDER_KEY"),
        base_url=os.getenv("UIPATH_BASE_URL", DEFAULT_BASE_URL),
        scope=os.getenv("UIPATH_SCOPE", DEFAULT_SCOPE),
    )


def _access_token(config: UiPathConfig) -> str:
    response = requests.post(
        TOKEN_URL,
        data={
            "client_id": config.client_id,
            "client_secret": config.client_secret,
            "grant_type": "client_credentials",
            "scope": config.scope,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30,
    )
    if response.status_code >= 400:
        raise UiPathError(f"UiPath token request failed ({response.status_code}): {response.text}")

    data = response.json()
    token = data.get("access_token")
    if not isinstance(token, str) or not token:
        raise UiPathError("UiPath token response did not include access_token.")
    return token


def start_job(
    config: UiPathConfig,
    *,
    release_key: str | None = None,
    input_arguments: dict[str, Any] | None = None,
    robot_ids: Sequence[int] | None = None,
    jobs_count: int = 0,
    strategy: str = "Specific",
    folder_key: str | None = None,
) -> dict[str, Any]:
    """Start a UiPath Orchestrator job and return the API response."""

    key = release_key or config.release_key
    if not key:
        raise UiPathError("release_key is required to start a UiPath job.")

    token = _access_token(config)
    target_url = (
        f"{config.base_url.rstrip('/')}"
        f"/{config.organization_name}/{config.tenant_name}"
        "/orchestrator_/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs"
    )

    body: dict[str, Any] = {
        "startInfo": {
            "ReleaseKey": key,
            "Strategy": strategy,
            "RobotIds": list(robot_ids or []),
            "JobsCount": jobs_count,
        }
    }
    if input_arguments:
        body["startInfo"]["InputArguments"] = json.dumps(input_arguments, separators=(",", ":"))

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    folder = folder_key or config.folder_key
    if folder:
        headers["X-UIPATH-FolderKey"] = folder

    response = requests.post(target_url, json=body, headers=headers, timeout=30)
    if response.status_code >= 400:
        raise UiPathError(f"UiPath start job failed ({response.status_code}): {response.text}")

    return response.json()
