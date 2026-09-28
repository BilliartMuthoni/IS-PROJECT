"""Commit and push the repository clone on Drive from a Colab session.

The token is passed only on the push command line and never written to the
Git config, so it does not persist on Drive.
"""

import subprocess
from pathlib import Path


def _git(repo: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", "-C", str(repo), *args], capture_output=True, text=True
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip())
    return result.stdout.strip()


def status(repo: Path) -> str:
    return _git(repo, "status", "--short", "--branch")


def push(repo: Path, message: str, token: str, name: str, email: str) -> str:
    _git(repo, "add", "-A")
    if not _git(repo, "status", "--porcelain"):
        return "Nothing to commit."

    _git(repo, "-c", f"user.name={name}", "-c", f"user.email={email}", "commit", "-m", message)

    origin = _git(repo, "remote", "get-url", "origin")
    authed = origin.replace("https://", f"https://x-access-token:{token}@", 1)
    branch = _git(repo, "rev-parse", "--abbrev-ref", "HEAD")
    try:
        _git(repo, "push", authed, f"HEAD:{branch}")
    except RuntimeError as err:
        raise RuntimeError(str(err).replace(token, "***")) from None

    return f"Pushed to {branch}: {_git(repo, 'log', '-1', '--oneline')}"
