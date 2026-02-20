#!/usr/bin/env python3
"""Extract candidate tasks from Slack messages exported as JSON."""

from __future__ import annotations

import argparse
import html
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

CHECKBOX_RE = re.compile(r"^\s*[-*]\s*\[\s\]\s*(.+)$", re.IGNORECASE)
TAGGED_TASK_RE = re.compile(
    r"^\s*(todo|task|action(?:\s+item)?|next\s+step|follow[- ]?up)\s*[:\-]\s*(.+)$",
    re.IGNORECASE,
)
REQUEST_RE = re.compile(r"^\s*(please|can you|could you|need to|we should)\s+(.+)$", re.IGNORECASE)
DUE_HINT_RE = re.compile(r"\b(?:by|before|due(?:\s+on)?)\s+([A-Za-z0-9,\/\- ]{3,30})", re.IGNORECASE)
OWNER_HINT_RE = re.compile(r"@([A-Z0-9]{2,})")
ACTION_VERBS = (
    "ship",
    "fix",
    "update",
    "draft",
    "review",
    "send",
    "prepare",
    "schedule",
    "follow",
    "confirm",
    "document",
    "investigate",
    "create",
    "triage",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="Input JSON path from fetch_slack_messages.py")
    parser.add_argument(
        "--markdown-output",
        default="task-intake.md",
        help="Output Markdown path (default: task-intake.md)",
    )
    parser.add_argument(
        "--json-output",
        default="task-intake.json",
        help="Output JSON path (default: task-intake.json)",
    )
    parser.add_argument(
        "--min-score",
        type=int,
        default=2,
        help="Minimum score to keep a candidate task (default: 2)",
    )
    parser.add_argument(
        "--max-tasks",
        type=int,
        default=200,
        help="Maximum number of tasks to emit (default: 200)",
    )
    return parser.parse_args()


def normalize_text(text: str) -> str:
    text = html.unescape(text or "")
    text = re.sub(r"<@([A-Z0-9]+)>", r"@\1", text)
    text = re.sub(r"<#([A-Z0-9]+)\|([^>]+)>", r"#\2", text)
    text = re.sub(r"<([^>|]+)\|([^>]+)>", r"\2 (\1)", text)
    text = re.sub(r"<(https?://[^>]+)>", r"\1", text)
    text = text.replace("\u00a0", " ")
    return text.strip()


def normalize_title(text: str) -> str:
    title = re.sub(r"\s+", " ", text).strip(" -:\t")
    title = re.sub(r"[.!,;:]+$", "", title)
    return title[:160].strip()


def infer_task_from_line(line: str) -> tuple[str, int, list[str]]:
    score = 0
    reasons: list[str] = []
    title = line

    checkbox_match = CHECKBOX_RE.match(line)
    tagged_match = TAGGED_TASK_RE.match(line)
    request_match = REQUEST_RE.match(line)

    if checkbox_match:
        score += 3
        title = checkbox_match.group(1)
        reasons.append("explicit checkbox")
    elif tagged_match:
        score += 3
        title = tagged_match.group(2)
        reasons.append("task marker prefix")
    elif request_match and "?" not in line:
        score += 2
        title = request_match.group(2)
        reasons.append("direct request phrasing")

    lowered = title.lower()
    if any(f" {verb} " in f" {lowered} " for verb in ACTION_VERBS):
        score += 1
        reasons.append("contains action verb")
    if DUE_HINT_RE.search(title):
        score += 1
        reasons.append("contains due hint")
    if OWNER_HINT_RE.search(title):
        score += 1
        reasons.append("contains owner mention")
    if "?" in title and score < 3:
        score -= 1
        reasons.append("looks like a question")

    title = normalize_title(title)
    if len(title) < 8:
        score -= 1
        reasons.append("too short")

    return title, score, reasons


def extract_tasks(messages: list[dict[str, Any]], min_score: int, max_tasks: int) -> list[dict[str, Any]]:
    tasks: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str]] = set()

    for message in messages:
        raw_text = normalize_text(message.get("text", ""))
        if not raw_text:
            continue

        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        if not lines:
            continue

        for line in lines:
            title, score, reasons = infer_task_from_line(line)
            if score < min_score or not title:
                continue

            owner = OWNER_HINT_RE.search(raw_text)
            due = DUE_HINT_RE.search(raw_text)
            key = (title.lower(), owner.group(1) if owner else "", due.group(1).lower().strip() if due else "")
            if key in seen:
                continue
            seen.add(key)

            confidence = "low"
            if score >= 4:
                confidence = "high"
            elif score >= 3:
                confidence = "medium"

            tasks.append(
                {
                    "id": f"T{len(tasks) + 1:03d}",
                    "title": title,
                    "score": score,
                    "confidence": confidence,
                    "owner_hint": owner.group(1) if owner else None,
                    "due_hint": due.group(1).strip() if due else None,
                    "source_channel": message.get("channel"),
                    "source_ts": message.get("ts"),
                    "source_user": message.get("user"),
                    "text_excerpt": raw_text[:240],
                    "rationale": reasons,
                }
            )

            if len(tasks) >= max_tasks:
                return tasks

    return tasks


def load_messages(path: Path) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(payload, dict):
        messages = payload.get("messages", [])
        if isinstance(messages, list):
            return messages
        return []
    if isinstance(payload, list):
        return payload
    return []


def write_markdown(path: Path, tasks: list[dict[str, Any]], source_file: Path) -> None:
    lines = [
        "# Slack Task Intake",
        "",
        f"- Generated: {datetime.now(timezone.utc).isoformat()}",
        f"- Source file: `{source_file}`",
        f"- Tasks found: {len(tasks)}",
        "",
        "| ID | Task | Owner Hint | Due Hint | Confidence | Source |",
        "| --- | --- | --- | --- | --- | --- |",
    ]

    for task in tasks:
        task_title = task["title"].replace("|", "\\|")
        owner = f"@{task['owner_hint']}" if task.get("owner_hint") else ""
        due = (task.get("due_hint") or "").replace("|", "\\|")
        source = f"{task.get('source_channel', '')}:{task.get('source_ts', '')}"
        lines.append(
            f"| {task['id']} | {task_title} | {owner} | {due} | {task['confidence']} | {source} |"
        )

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    args = parse_args()
    input_path = Path(args.input).expanduser().resolve()
    md_path = Path(args.markdown_output).expanduser().resolve()
    json_path = Path(args.json_output).expanduser().resolve()

    messages = load_messages(input_path)
    tasks = extract_tasks(messages, min_score=args.min_score, max_tasks=args.max_tasks)
    tasks.sort(key=lambda task: (task["score"], task.get("source_ts", "")), reverse=True)

    write_markdown(md_path, tasks, input_path)
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(tasks, indent=2) + "\n", encoding="utf-8")

    print(f"Parsed {len(messages)} messages and wrote {len(tasks)} tasks")
    print(f"Markdown: {md_path}")
    print(f"JSON: {json_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
