import axios from 'axios';
import process from 'process';

const EMBED_LIMITS = {
    title: 256,
    description: 4096,
    fields: 25,
    fieldName: 256,
    fieldValue: 1024,
    footerText: 2048,
    authorName: 256
};

function expandEnvVariables(text) {
    return text.replace(/\$\{(\w+)\}/g, (_, v) => process.env[v] || '');
}

function validateEmbed(embed) {
    if (embed.title && embed.title.length > EMBED_LIMITS.title) {
        throw new Error(`Embed title exceeds ${EMBED_LIMITS.title} characters.`);
    }
    if (embed.description && embed.description.length > EMBED_LIMITS.description) {
        throw new Error(`Embed description exceeds ${EMBED_LIMITS.description} characters.`);
    }
    if (embed.fields && embed.fields.length > EMBED_LIMITS.fields) {
        throw new Error(`Embed fields exceed ${EMBED_LIMITS.fields} field objects.`);
    }
    if (embed.fields) {
        embed.fields.forEach(field => {
            if (field.name.length > EMBED_LIMITS.fieldName) {
                throw new Error(`Embed field name exceeds ${EMBED_LIMITS.fieldName} characters.`);
            }
            if (field.value.length > EMBED_LIMITS.fieldValue) {
                throw new Error(`Embed field value exceeds ${EMBED_LIMITS.fieldValue} characters.`);
            }
        });
    }
    if (embed.footer && embed.footer.text && embed.footer.text.length > EMBED_LIMITS.footerText) {
        throw new Error(`Embed footer text exceeds ${EMBED_LIMITS.footerText} characters.`);
    }
    if (embed.author && embed.author.name && embed.author.name.length > EMBED_LIMITS.authorName) {
        throw new Error(`Embed author name exceeds ${EMBED_LIMITS.authorName} characters.`);
    }
}

async function sendDiscordMessage(webhookUrl, payload) {
    if (!webhookUrl) {
        console.error("❌ Missing webhook URL. Set it via INPUT_WEBHOOK_URL or DISCORD_WEBHOOK_URL env.");
        process.exit(1);
    }

    console.info("🚀 Sending message to Discord...");

    try {
        const response = await axios.post(webhookUrl, payload);

        if (response.status === 204) {
            console.info("✅ Message sent successfully!");
        } else {
            console.error(`❌ Failed to send message. HTTP ${response.status}: ${response.statusText}`);
            process.exit(1);
        }
    } catch (error) {
        console.error(`❌ Request failed: ${error}`);
        process.exit(1);
    }
}

export async function run() {
    console.info("🔍 Checking environment variables...");

    // Retrieve inputs
    const webhookUrl = (process.env.INPUT_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL || '').trim();
    const content = (process.env.INPUT_CONTENT || '').trim();
    const username = (process.env.INPUT_USERNAME || '').trim();
    const avatarUrl = (process.env.INPUT_AVATAR_URL || '').trim();
    const tts = (process.env.INPUT_TTS || '').trim().toLowerCase() === 'true';
    const embedTitle = (process.env.INPUT_EMBED_TITLE || '').trim();
    const embedDescription = (process.env.INPUT_EMBED_DESCRIPTION || '').trim();
    const embedUrl = (process.env.INPUT_EMBED_URL || '').trim();
    const embedTimestamp = (process.env.INPUT_EMBED_TIMESTAMP || '').trim();
    const embedColor = (process.env.INPUT_EMBED_COLOR || '').trim();
    const embedAuthorName = (process.env.INPUT_EMBED_AUTHOR_NAME || '').trim();
    const embedAuthorUrl = (process.env.INPUT_EMBED_AUTHOR_URL || '').trim();
    const embedAuthorIconUrl = (process.env.INPUT_EMBED_AUTHOR_ICON_URL || '').trim();
    const embedFooterText = (process.env.INPUT_EMBED_FOOTER_TEXT || '').trim();
    const embedFooterIconUrl = (process.env.INPUT_EMBED_FOOTER_ICON_URL || '').trim();
    const embedFields = (process.env.INPUT_EMBED_FIELDS || '').trim();
    const showPayload = (process.env.INPUT_SHOW_PAYLOAD || 'false').trim().toLowerCase() === 'true';

    let repoUrl = 'https://github.com/owner/repo'; // Default URL
    if (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_REF_NAME) {
      repoUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/src/branch/${process.env.GITHUB_REF_NAME}`;
    }

    if (!webhookUrl) {
        console.error("❌ No webhook URL provided! Set the `DISCORD_WEBHOOK_URL` environment variable or provide the `webhook_url` input.");
        process.exit(1);
    }

    if (content && embedDescription) {
        console.error("❌ Both content and embed description provided! Ensure only one of `content` or `embed_description` is set. Exiting.");
        process.exit(1);
    }

    if (content && content.length > 2000) {
        console.error("❌ Content exceeds 2000 characters! Ensure the `content` input is within the limit. Exiting.");
        process.exit(1);
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

    if (!content && (embedTitle || embedDescription || embedUrl || embedTimestamp || embedColor || embedAuthorName || embedAuthorUrl || embedAuthorIconUrl || embedFooterText || embedFooterIconUrl || embedFields)) {
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
                console.error("❌ Invalid JSON for embed fields. Ensure the `embed_fields` input is a valid JSON array.");
                process.exit(1);
            }
        }

        validateEmbed(embed);
        payload.embeds = [embed];
    }

    if (showPayload) {
        console.info(`📢 Payload: ${JSON.stringify(payload)}`);
    }

    await sendDiscordMessage(webhookUrl, payload);
}
