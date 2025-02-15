import os
import requests
import logging
import sys

# Configure logging to stdout (for visibility in GitHub Actions or Gitea UI)
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Default color schemes
COLOR_SCHEMES = {
    "notification": 0x3498DB,  # Blue
    "warning": 0xF1C40F,      # Yellow
    "error": 0xE74C3C,        # Red
    "success": 0x2ECC71,      # Green
    "info": 0x1ABC9C         # Teal
}

def expand_env_variables(text):
    """
    Expands environment variables inside a given string.
    """
    return os.path.expandvars(text)

def send_discord_message(webhook_url, title, message, username, color, repo_url):
    """
    Sends a message to Discord using the provided webhook URL.
    Logs all key steps for debugging and visibility.
    """
    if not webhook_url:
        logging.error("❌ Missing webhook URL. Set it via INPUT_WEBHOOK_URL or DISCORD_WEBHOOK_URL env.")
        sys.exit(1)

    if not message:
        logging.error("❌ No message provided. Exiting.")
        sys.exit(1)

    message = expand_env_variables(message)  # Expand env variables in the message
    title = title or "Info"
    color = color.strip() if color else COLOR_SCHEMES.get(title.lower(), COLOR_SCHEMES["info"])  # Default to info teal
    
    if isinstance(color, str):  # Convert color only if it's a string
        try:
            color = int(color, 16)
        except ValueError:
            color = COLOR_SCHEMES["info"]
    
    # Create an embed with a dynamic color and repo URL
    embed = {
        "title": title,
        "description": message,
        "color": color,
        "url": repo_url  # Add repository URL
    }
    
    payload = {"embeds": [embed]}
    
    if username:
        payload["username"] = username
        logging.info(f"📢 Username: {username}")

    logging.info(f"📢 Title: {title}")
    logging.info(f"📢 Message: {message}")
    logging.info(f"📢 Embed Color: {color}")
    logging.info(f"📢 Repository URL: {repo_url}")
    logging.info("🚀 Sending message to Discord...")

    try:
        response = requests.post(webhook_url, json=payload)

        if response.status_code == 204:
            logging.info("✅ Message sent successfully!")
        else:
            logging.error(f"❌ Failed to send message. HTTP {response.status_code}: {response.text}")
            sys.exit(1)

    except requests.RequestException as e:
        logging.error(f"❌ Request failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    logging.info("🔍 Checking environment variables...")

    # Retrieve inputs
    webhook_url = os.getenv("INPUT_WEBHOOK_URL", "").strip() or os.getenv("DISCORD_WEBHOOK_URL", "").strip()
    title = os.getenv("INPUT_TITLE", "").strip()
    message = os.getenv("INPUT_MESSAGE", "").strip()
    username = os.getenv("INPUT_USERNAME", "").strip()
    color = os.getenv("INPUT_COLOR", "").strip()
    repo_url = os.getenv("GITHUB_SERVER_URL", "") + "/" + os.getenv("GITHUB_REPOSITORY", "") + "/src/branch/" + os.getenv("GITHUB_REF_NAME", "")

    if not webhook_url:
        logging.error(
            "❌ No webhook URL provided! Set the `DISCORD_WEBHOOK_URL` environment variable or provide the `webhook_url` input."
        )
        sys.exit(1)

    if not message:
        logging.error("❌ No message provided! Ensure the `message` input is set. Exiting.")
        sys.exit(1)

    logging.info("🚀 Starting Discord webhook notification...")
    send_discord_message(webhook_url, title, message, username, color, repo_url)
