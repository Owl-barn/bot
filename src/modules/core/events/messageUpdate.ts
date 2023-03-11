import { warningEmbedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { logType } from "@lib/services/logService";
import { state } from "@app";
import { Event } from "@structs/event";
import { GuildMember, escapeMarkdown } from "discord.js";

export default Event({
  name: "messageUpdate",
  once: false,
  ignoreBans: true,

  async execute(old, current) {
    if (!current.guildId) return;
    if (old.member?.user.bot) return;

    const config = state.guilds.get(current.guildId);

    if (!config || !config.log_events || config.banned) return;
    if (old.content == current.content) return;

    const member = current.member as GuildMember;

    const embed = warningEmbedTemplate();

    const oldMsg = old.content
      ? `\`\`\`${escapeMarkdown(old.content)}\`\`\`\n`
      : "*empty*\n";

    const newMsg = current.content
      ? `\`\`\`${escapeMarkdown(current.content)}\`\`\`\n`
      : "*empty*\n";

    embed.setTitle("Message updated");
    embed.setDescription(
      `<#${current.channelId}>\n` +
      "**old:**\n" +
      oldMsg +
      "**current:**\n" +
      newMsg,
    );
    embed.setFooter({
      text: `${member.user.tag} <@${member.id}>`,
      iconURL: getAvatar(member),
    });

    state.log.push(embed, current.guildId, logType.EVENT);
  },
});
