"""The provider-specific half of "Continue with Google" (OAuth 2.0, RFC 6749, with
OpenID Connect on top).

The farmer signs in on Google's own page, so Sproutly never sees that password.
Google then sends the browser back to our callback with a short-lived code, which
the backend swaps, server to server and with the client secret, for an access token
it uses once to read who the user is. A provider is just its addresses and how it
reports the user's ID and verified email, so the flow in app/routers/oauth.py does
not depend on it.

GitHub sign-in was built and then removed: farmers rarely have GitHub accounts and
admins use a password with a mandatory authenticator code, so it served no one, and
an unused sign-in route is only extra attack surface.
"""

from dataclasses import dataclass
from typing import Callable, Optional
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


def _google_identity(client: httpx.Client, access_token: str) -> tuple[str, Optional[str]]:
    # OpenID Connect userinfo: "sub" is Google's permanent user ID.
    info = client.get("https://openidconnect.googleapis.com/v1/userinfo",
                      headers={"Authorization": f"Bearer {access_token}"})
    info.raise_for_status()
    data = info.json()
    return str(data["sub"]), data.get("email") if data.get("email_verified") else None


@dataclass
class Provider:
    authorize_url: str
    token_url: str
    # Read-only: the user's ID and email address with its verified flag, nothing else.
    scope: str
    client_id: Callable[[], str]
    client_secret: Callable[[], str]
    identity: Callable[[httpx.Client, str], tuple[str, Optional[str]]]


PROVIDERS = {
    "google": Provider(
        authorize_url="https://accounts.google.com/o/oauth2/v2/auth",
        token_url="https://oauth2.googleapis.com/token",
        scope="openid email",
        client_id=lambda: settings.google_client_id,
        client_secret=lambda: settings.google_client_secret,
        identity=_google_identity,
    ),
}


def is_configured(provider: str) -> bool:
    p = PROVIDERS.get(provider)
    return bool(p and p.client_id() and p.client_secret())


def callback_url(provider: str, request_base: str) -> str:
    """Where the provider sends the browser back to: PUBLIC_BASE_URL if set, otherwise the
    address this request came in on (the laptop's current IP). The provider only accepts
    addresses registered with it, so a forged Host header cannot redirect anywhere else."""
    base = settings.public_base_url or request_base
    return f"{base.rstrip('/')}/auth/oauth/{provider}/callback"


def authorization_url(provider: str, state: str, code_challenge: str, redirect_uri: str) -> str:
    """The provider's sign-in page the browser is sent to."""
    p = PROVIDERS[provider]
    query = {
        "client_id": p.client_id(),
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": p.scope,
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        # Always show the account chooser: the phone's browser remembers whoever signed in
        # last, and without this a second person (or a second account) cannot be chosen.
        "prompt": "select_account",
    }
    return f"{p.authorize_url}?{urlencode(query)}"


def fetch_identity(provider: str, code: str, code_verifier: str, redirect_uri: str) -> Identity:
    """Swap the callback code for an access token, then read the user's ID and verified email.

    redirect_uri must be exactly the one sent to the sign-in page."""
    p = PROVIDERS[provider]
    try:
        with httpx.Client(timeout=TIMEOUT) as client:
            token = client.post(
                p.token_url,
                headers={"Accept": "application/json"},
                data={
                    "client_id": p.client_id(),
                    "client_secret": p.client_secret(),
                    "code": code,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                    "code_verifier": code_verifier,
                },
            ).json()
            if "access_token" not in token:
                # e.g. invalid_grant when the code was already used or has expired.
                raise OAuthError(token.get("error", "no access token"))
            subject, email = p.identity(client, token["access_token"])
    except httpx.HTTPError as exc:
        raise OAuthError(f"{provider} could not be reached: {type(exc).__name__}") from None

    return Identity(provider=provider, subject=subject, email=email.lower() if email else None)
