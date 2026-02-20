# Slack Setup

Use this setup only when a Slack app or scopes are not ready.

## Create or Reuse an App

1. Open Slack app management and create an app in the target workspace.
2. Enable a bot user for the app.
3. Install or reinstall the app to the workspace after scope changes.

## Minimum Token and Scopes

Use a bot token (`xoxb-...`) in environment variable `SLACK_BOT_TOKEN`.

Add history read scopes based on conversation type:
- Public channels: `channels:history`
- Private channels: `groups:history`
- Direct messages: `im:history`
- Group DMs: `mpim:history`

## Channel Access

Invite the bot to each channel you need to read; otherwise API calls return no history.

## Verification

Run:

```bash
python3 scripts/fetch_slack_messages.py --channel <CHANNEL_ID> --days 1 --output /tmp/slack_probe.json
```

If the output has messages, extraction can proceed with `create_tasks_from_messages.py`.
