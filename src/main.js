import axios from "axios";
import * as core from "@actions/core";

const EMBED_LIMITS = {
  title: 256,
  description: 4096,
  fields: 25,
  fieldName: 256,
  fieldValue: 1024,
  footerText: 2048,
  authorName: 256,
};

function expandEnvVariables(text) {
  return text.replace(/\$\{(\w+)\}|\$(\w+)/g, (_, v1, v2) => process.env[v1 || v2] || "");
}

function validateEmbed(embed) {
  if (embed.title && embed.title.length > EMBED_LIMITS.title) {
    throw new Error(`Embed title exceeds ${EMBED_LIMITS.title} characters.`);
  }
  if (
    embed.description &&
    embed.description.length > EMBED_LIMITS.description
  ) {
    throw new Error(
      `Embed description exceeds ${EMBED_LIMITS.description} characters.`,
    );
  }
  if (embed.fields && embed.fields.length > EMBED_LIMITS.fields) {
    throw new Error(
      `Embed fields exceed ${EMBED_LIMITS.fields} field objects.`,
    );
  }
  if (embed.fields) {
    embed.fields.forEach((field) => {
      if (field.name.length > EMBED_LIMITS.fieldName) {
        throw new Error(
          `Embed field name exceeds ${EMBED_LIMITS.fieldName} characters.`,
        );
      }
      if (field.value.length > EMBED_LIMITS.fieldValue) {
        throw new Error(
          `Embed field value exceeds ${EMBED_LIMITS.fieldValue} characters.`,
        );
      }
    });
  }
  if (
    embed.footer &&
    embed.footer.text &&
    embed.footer.text.length > EMBED_LIMITS.footerText
  ) {
    throw new Error(
      `Embed footer text exceeds ${EMBED_LIMITS.footerText} characters.`,
    );
  }
  if (
    embed.author &&
    embed.author.name &&
    embed.author.name.length > EMBED_LIMITS.authorName
  ) {
    throw new Error(
      `Embed author name exceeds ${EMBED_LIMITS.authorName} characters.`,
    );
  }
}

async function sendDiscordMessage(webhookUrl, payload) {
  if (!webhookUrl) {
    core.setFailed(
      "❌ Missing webhook URL. Set it via INPUT_WEBHOOK_URL or DISCORD_WEBHOOK_URL env.",
    );
    return;
  }

  core.info("🚀 Sending message to Discord...");

  try {
    const response = await axios.post(webhookUrl, payload);

    if (response.status === 204) {
      core.info("✅ Message sent successfully!");
    } else {
      core.setFailed(
        `❌ Failed to send message. HTTP ${response.status}: ${response.statusText}`,
      );
    }
  } catch (error) {
    core.setFailed(`❌ Request failed: ${error}`);
  }
}

export async function run() {
  core.info("🔍 Checking environment variables...");

  // Retrieve inputs
  const webhookUrl = core.getInput("webhook_url") || process.env.DISCORD_WEBHOOK_URL || "";
  const content = core.getInput("content") || "";
  const username = core.getInput("username") || "";
  const avatarUrl = core.getInput("avatar_url") || "";
  const tts = core.getInput("tts") === "true";
  const embedTitle = core.getInput("embed_title") || "";
  const embedDescription = core.getInput("embed_description") || "";
  const embedUrl = core.getInput("embed_url") || "";
  const embedTimestamp = core.getInput("embed_timestamp") || "";
  const embedColor = core.getInput("embed_color") || "";
  const embedAuthorName = core.getInput("embed_author_name") || "";
  const embedAuthorUrl = core.getInput("embed_author_url") || "";
  const embedAuthorIconUrl = core.getInput("embed_author_icon_url") || "";
  const embedFooterText = core.getInput("embed_footer_text") || "";
  const embedFooterIconUrl = core.getInput("embed_footer_icon_url") || "";
  const embedFields = core.getInput("embed_fields") || "";
  const showPayload = core.getInput("show_payload") === "true";

  let repoUrl = "https://github.com/owner/repo"; // Default URL
  if (
    process.env.GITHUB_SERVER_URL &&
    process.env.GITHUB_REPOSITORY &&
    process.env.GITHUB_REF_NAME
  ) {
    repoUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/src/branch/${process.env.GITHUB_REF_NAME}`;
  }

  if (!webhookUrl) {
    core.setFailed(
      "❌ No webhook URL provided! Set the `DISCORD_WEBHOOK_URL` environment variable or provide the `webhook_url` input.",
    );
    return;
  }

  if (content && embedDescription) {
    core.setFailed(
      "❌ Both content and embed description provided! Ensure only one of `content` or `embed_description` is set. Exiting.",
    );
    return;
  }

  if (content && content.length > 2000) {
    core.setFailed(
      "❌ Content exceeds 2000 characters! Ensure the `content` input is within the limit. Exiting.",
    );
    return;
  }

  // Create the payload
  const payload = {};

  if (content) {
    payload.content = expandEnvVariables(content);
  }

  if (username) {
    payload.username = username;
  }

  if (avatarUrl) {
    payload.avatar_url = avatarUrl;
  }

  if (tts) {
    payload.tts = tts;
  }

  if (
    !content &&
    (embedTitle ||
      embedDescription ||
      embedUrl ||
      embedTimestamp ||
      embedColor ||
      embedAuthorName ||
      embedAuthorUrl ||
      embedAuthorIconUrl ||
      embedFooterText ||
      embedFooterIconUrl ||
      embedFields)
  ) {
    const embed = {};

    if (embedTitle) {
      embed.title = embedTitle;
    }

    if (embedDescription) {
      embed.description = expandEnvVariables(embedDescription);
    }

    if (embedUrl) {
      embed.url = embedUrl;
    }

    if (embedTimestamp) {
      embed.timestamp = embedTimestamp;
    }

    if (embedColor) {
      embed.color = parseInt(embedColor, 16);
    }

    if (embedAuthorName || embedAuthorUrl || embedAuthorIconUrl) {
      embed.author = {};
      if (embedAuthorName) {
        embed.author.name = embedAuthorName;
      }
      if (embedAuthorUrl) {
        embed.author.url = embedAuthorUrl;
      }
      if (embedAuthorIconUrl) {
        embed.author.icon_url = embedAuthorIconUrl;
      }
    }

    if (embedFooterText || embedFooterIconUrl) {
      embed.footer = {};
      if (embedFooterText) {
        embed.footer.text = embedFooterText;
      }
      if (embedFooterIconUrl) {
        embed.footer.icon_url = embedFooterIconUrl;
      }
    }

    if (embedFields) {
      try {
        embed.fields = JSON.parse(embedFields);
      } catch (error) {
        core.setFailed(
          "❌ Invalid JSON for embed fields. Ensure the `embed_fields` input is a valid JSON array.",
        );
        return;
      }
    }

    try {
      validateEmbed(embed);
    } catch (error) {
      core.setFailed(error.message);
      return;
    }
    payload.embeds = [embed];
  }

  if (showPayload) {
    core.info(`📢 Payload: ${JSON.stringify(payload)}`);
  }

  await sendDiscordMessage(webhookUrl, payload);
}
