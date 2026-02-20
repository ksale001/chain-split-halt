---
name: slack-task-intake
description: Read Slack messages and convert actionable discussion into structured tasks. Use when Codex needs to connect to Slack, ingest recent channel or thread history, and create task backlogs or checklists from those messages.
---

# Slack Task Intake

Use this skill to pull Slack message history and produce a reviewable task intake.

## Quick Start

Set the token, fetch messages, then extract candidate tasks:

```bash
export SLACK_BOT_TOKEN="xoxb-..."
python3 scripts/fetch_slack_messages.py \
  --channel C0123456789 \
  --days 7 \
  --include-thread-replies \
  --output /tmp/slack_messages.json

python3 scripts/create_tasks_from_messages.py \
  --input /tmp/slack_messages.json \
  --markdown-output /tmp/task_intake.md \
  --json-output /tmp/task_intake.json
```

## Workflow

1. Confirm access:
- Use a bot token in `SLACK_BOT_TOKEN`.
- Read `references/slack-setup.md` only when app/scopes are missing.
2. Pull source messages:
- Run `scripts/fetch_slack_messages.py`.
- Prefer a narrow window with `--days` and a specific channel.
- Add `--include-thread-replies` when decisions happen in threads.
3. Generate candidate tasks:
- Run `scripts/create_tasks_from_messages.py`.
- Adjust strictness with `--min-score` (default `2`).
4. Finalize and create tasks:
- Review low-confidence items.
- Create tickets in Linear/Jira/Todoist or copy to local backlog files.

## Skill Files

- `scripts/fetch_slack_messages.py`: Call Slack Web API and save normalized message JSON.
- `scripts/create_tasks_from_messages.py`: Heuristically extract action items and write Markdown + JSON.
- `references/slack-setup.md`: Minimal Slack app setup and scopes for history reads.

## Guardrails

- Treat extracted tasks as candidates, not ground truth.
- Process only channels and workspaces the user authorizes.
- Keep tokens in environment variables, never in committed files.
- Redact sensitive snippets before sharing task reports externally.
