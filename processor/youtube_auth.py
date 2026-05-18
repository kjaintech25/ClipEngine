"""One-time YouTube OAuth helper.

Run this once after setting YOUTUBE_CLIENT_ID + YOUTUBE_CLIENT_SECRET in .env:

    source .venv/bin/activate
    python youtube_auth.py

A browser window opens — authorize the ClipEngine app with the Google account
that owns your YouTube channel. The script then prints a refresh token. Paste
it into .env as YOUTUBE_REFRESH_TOKEN and you're done — the processor can post.
"""

from __future__ import annotations

import os
import sys

from dotenv import load_dotenv

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]


def main() -> None:
    load_dotenv()
    client_id = os.environ.get("YOUTUBE_CLIENT_ID")
    client_secret = os.environ.get("YOUTUBE_CLIENT_SECRET")
    if not client_id or not client_secret:
        print(
            "Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in .env first.\n"
            "See the 'YouTube setup' section of README.md.",
            file=sys.stderr,
        )
        sys.exit(1)

    from google_auth_oauthlib.flow import InstalledAppFlow

    client_config = {
        "installed": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost"],
        }
    }
    flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
    creds = flow.run_local_server(port=0)

    if not creds.refresh_token:
        print(
            "No refresh token returned. Revoke the app's access at "
            "https://myaccount.google.com/permissions and run this again.",
            file=sys.stderr,
        )
        sys.exit(1)

    print("\n" + "=" * 60)
    print("SUCCESS — paste this into .env as YOUTUBE_REFRESH_TOKEN:\n")
    print(creds.refresh_token)
    print("=" * 60)


if __name__ == "__main__":
    main()
