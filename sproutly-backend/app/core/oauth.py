"""The provider-specific half of "Continue with GitHub" (OAuth 2.0, RFC 6749).

The farmer signs in on GitHub's own page, so Sproutly never sees their GitHub
password. GitHub then sends the browser back to our callback with a short-lived
code, which the backend swaps, server to server and with the client secret, for
an access token it uses once to read who the user is. Google is added here the
same way later.
"""

from dataclasses import dataclass
from typing import Optional
from urllib.parse import urlencode

import httpx

from app.core.config import settings

TIMEOUT = httpx.Timeout(10.0)


class OAuthError(Exception):
    """The provider refused the sign-in or could not be reached."""


@dataclass
class Identity:
    provider: str
    # The provider's permanent ID for this person; unlike an email it never changes.
    subject: str
    # Only an address the provider has itself verified, otherwise None.
    email: Optional[str]


def is_configured(provider: str) -> bool:
    return provider == "github" and bool(settings.github_client_id and settings.github_client_secret)


def callback_url(provider: str) -> str:
    return f"{settings.public_base_url.rstrip('/')}/auth/oauth/{provider}/callback"


def authorization_url(provider: str, state: str, code_challenge: str) -> str:
    """The provider's sign-in page the browser is sent to."""
    query = {
        "client_id": settings.github_client_id,
        "redirect_uri": callback_url(provider),
        # Read-only: the profile ID and the email addresses with their verified flag.
        "scope": "read:user user:email",
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }
    return "https://github.com/login/oauth/authorize?" + urlencode(query)


def fetch_identity(provider: str, code: str, code_verifier: str) -> Identity:
    """Swap the callback code for an access token, then read the user's ID and verified email."""
    try:
        with httpx.Client(timeout=TIMEOUT) as client:
            token = client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                    "redirect_uri": callback_url(provider),
                    "code_verifier": code_verifier,
                },
            ).json()
            if "access_token" not in token:
                # e.g. bad_verification_code when the code was already used or has expired.
                raise OAuthError(token.get("error", "no access token"))

            headers = {
                "Authorization": f"Bearer {token['access_token']}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            }
            user = client.get("https://api.github.com/user", headers=headers)
            user.raise_for_status()
            emails = client.get("https://api.github.com/user/emails", headers=headers)
            emails.raise_for_status()
    except httpx.HTTPError as exc:
        raise OAuthError(f"GitHub could not be reached: {type(exc).__name__}") from None

    verified = [e for e in emails.json() if e.get("verified")]
    primary = next((e for e in verified if e.get("primary")), verified[0] if verified else None)
    return Identity(provider=provider, subject=str(user.json()["id"]), email=primary["email"].lower() if primary else None)
