import { Message } from "discord.js";
import { failEmbedTemplate } from "../lib/embedTemplate";
import { getAvatar } from "../lib/functions";
import GuildConfig from "../lib/guildconfig.service";
import logService, { logType } from "../modules/logger.service";
import RavenEvent from "../types/event";

export default class InteractionCreate implements RavenEvent {
  name = "messageDelete";
  once = false;

  async execute(msg: Message): Promise<void> {
    if (!msg.guildId) return;
    if (msg.member?.user.bot) return;
    if (msg.content == "") return;
    const config = GuildConfig.getGuild(msg.guildId);
    if (!config || !config.log_events || config.banned) return;

    const embed = failEmbedTemplate();

    embed.setTitle("Message Deleted");
    embed.setDescription(
      `<#${msg.channelId}>\n` + `\`\`\`${msg.content}\`\`\``,
    );

    const member = msg.member;
    if (member) {
      const avatar = getAvatar(member);

      embed.setFooter({
        text: `${member.user.tag} <@${member.id}>`,
        iconURL: avatar,
      });
    }

    logService.log(embed, msg.guildId, logType.EVENT);
  }
}
