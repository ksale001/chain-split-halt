#!/usr/bin/env python3
"""Fetch Slack messages from a channel and save normalized JSON output."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

API_BASE = "https://slack.com/api"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--channel", required=True, help="Slack channel ID (example: C0123456789)")
    parser.add_argument("--output", required=True, help="Path to output JSON file")
    parser.add_argument(
        "--token-env",
        default="SLACK_BOT_TOKEN",
        help="Environment variable that stores the bot token (default: SLACK_BOT_TOKEN)",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=3,
        help="Lookback window in days when --oldest-ts is not provided (default: 3)",
    )
    parser.add_argument(
        "--oldest-ts",
        type=float,
        help="Slack timestamp boundary (epoch seconds). Overrides --days.",
    )
    parser.add_argument(
        "--max-messages",
        type=int,
        default=500,
        help="Maximum number of messages to keep in output (default: 500)",
    )
    parser.add_argument(
        "--include-thread-replies",
        action="store_true",
        help="Fetch thread replies for parent messages that have replies",
    )
    return parser.parse_args()


def slack_api_get(token: str, endpoint: str, params: dict[str, Any]) -> dict[str, Any]:
    query = urlencode({k: v for k, v in params.items() if v is not None})
    url = f"{API_BASE}/{endpoint}?{query}"
    request = Request(url, headers={"Authorization": f"Bearer {token}"})

    while True:
        try:
            with urlopen(request, timeout=30) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            if exc.code == 429:
                retry_after = int(exc.headers.get("Retry-After", "1"))
                time.sleep(max(retry_after, 1))
                continue
            raise RuntimeError(f"Slack API HTTP error ({endpoint}): {exc.code}") from exc
        except URLError as exc:
            raise RuntimeError(f"Slack API network error ({endpoint}): {exc.reason}") from exc

        if not payload.get("ok"):
            error = payload.get("error", "unknown_error")
            raise RuntimeError(f"Slack API error ({endpoint}): {error}")
        return payload


def fetch_channel_history(token: str, channel: str, oldest_ts: float, max_messages: int) -> list[dict[str, Any]]:
    cursor = None
    messages: list[dict[str, Any]] = []
    page_limit = 200

    while True:
        remaining = max(max_messages - len(messages), 1)
        params = {
            "channel": channel,
            "limit": min(page_limit, remaining),
            "oldest": f"{oldest_ts:.6f}",
            "cursor": cursor,
        }
        payload = slack_api_get(token, "conversations.history", params)
        batch = payload.get("messages", [])
        messages.extend(batch)

        cursor = payload.get("response_metadata", {}).get("next_cursor") or None
        if not cursor or len(messages) >= max_messages:
            break

    return messages[:max_messages]


def fetch_thread_replies(
    token: str,
    channel: str,
    parents: list[dict[str, Any]],
    oldest_ts: float,
    max_messages: int,
) -> list[dict[str, Any]]:
    replies: list[dict[str, Any]] = []
    for parent in parents:
        if len(replies) >= max_messages:
            break
        if int(parent.get("reply_count", 0) or 0) <= 0:
            continue
        parent_ts = parent.get("thread_ts") or parent.get("ts")
        if not parent_ts:
            continue

        cursor = None
        while True:
            params = {
                "channel": channel,
                "ts": parent_ts,
                "limit": 200,
                "oldest": f"{oldest_ts:.6f}",
                "cursor": cursor,
            }
            payload = slack_api_get(token, "conversations.replies", params)
            batch = payload.get("messages", [])
            for message in batch:
                if message.get("ts") == parent_ts:
                    continue
                message["parent_ts"] = parent_ts
                replies.append(message)
                if len(replies) >= max_messages:
                    break

            if len(replies) >= max_messages:
                break

            cursor = payload.get("response_metadata", {}).get("next_cursor") or None
            if not cursor:
                break

    return replies[:max_messages]


def normalize_messages(raw_messages: list[dict[str, Any]], channel: str) -> list[dict[str, Any]]:
    deduped: dict[str, dict[str, Any]] = {}
    for message in raw_messages:
        ts = message.get("ts")
        text = message.get("text", "")
        if not ts or not text:
            continue
        deduped[ts] = {
            "ts": ts,
            "text": text,
            "user": message.get("user"),
            "subtype": message.get("subtype"),
            "thread_ts": message.get("thread_ts"),
            "parent_ts": message.get("parent_ts"),
            "channel": channel,
        }

    return sorted(deduped.values(), key=lambda item: float(item["ts"]))


def main() -> int:
    args = parse_args()

    token = os.environ.get(args.token_env)
    if not token:
        print(f"Missing token in environment variable: {args.token_env}", file=sys.stderr)
        return 1

    now_ts = datetime.now(timezone.utc).timestamp()
    oldest_ts = args.oldest_ts if args.oldest_ts is not None else now_ts - (args.days * 86400)

    history = fetch_channel_history(token, args.channel, oldest_ts, args.max_messages)
    messages = history

    if args.include_thread_replies:
        replies = fetch_thread_replies(token, args.channel, history, oldest_ts, args.max_messages)
        messages = history + replies

    normalized = normalize_messages(messages, args.channel)
    payload = {
        "source": "slack",
        "channel": args.channel,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "oldest_ts": oldest_ts,
        "message_count": len(normalized),
        "messages": normalized[: args.max_messages],
    }

    output_path = Path(args.output).expanduser().resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    print(f"Wrote {payload['message_count']} messages to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
