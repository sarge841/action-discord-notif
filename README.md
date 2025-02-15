# Send Discord Message Action

This action sends a message to a Discord channel via a webhook using an embedded message format with a customizable border color.

## Features

- Sends a message to a Discord channel via a webhook.
- Uses an embed with a customizable border color for better formatting.
- Supports expanding environment variables inside messages.
- Optionally allows setting a custom username for the message.
- Allows setting a title for the message embed.
- Uses a lightweight Python-based Docker container for efficiency.

## Inputs

### `webhook_url`

**Optional** - The Discord webhook URL. If not provided as an input, it must be set as an environment variable `DISCORD_WEBHOOK_URL`.

### `message`

**Required** - The message to send to Discord. Supports environment variable expansion.

### `username`

**Optional** - The username to send the message as. If not specified, the webhook's default username will be used.

### `title`

**Optional** - The title of the embedded message.

### `color`

**Optional** - The color of the embed border for the Discord notification, specified as a hexadecimal number (e.g., `FF5733`).

## Environment Variables

### `DISCORD_WEBHOOK_URL`

If `webhook_url` is not provided as an input, this environment variable must be set with the Discord webhook URL.

## How the Message is Sent

The message will be formatted as a **Discord Embed**. The embed will include:

- **Title** (if provided)
- **Message content**
- **Custom border color**, defaulting to blue for notifications, yellow for warnings, red for errors, green for success, and teal for general info.
- **A link to the repository and branch** where the action was executed.

## Example Usage

### Basic Usage in Gitea Actions

```yaml
name: Send Discord Notification
on: push

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Send Discord Message
        uses: jakecabrera/action-discord-notif@v1
        with:
          webhook_url: ${{ secrets.DISCORD_WEBHOOK_URL }}
          message: "A new commit by $GITHUB_ACTOR!"
          title: "Notification"
          color: "3498DB"
```

### Using an Environment Variable in the Workflow

```yaml
name: Send Discord Notification
on: push

jobs:
  notify:
    runs-on: ubuntu-latest
    env:
      DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Send Discord Message
        uses: jakecabrera/action-discord-notif@v1
        with:
          message: "Deployment by $GITHUB_ACTOR completed successfully!"
          title: "Success"
          color: "2ECC71"
```

## License

This action is open-source and free to use under the MIT license.
