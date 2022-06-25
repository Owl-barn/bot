import { GuildMember, Message } from "discord.js";
import { failEmbedTemplate } from "../lib/embedTemplate";
import { getAvatar } from "../lib/functions";
import GuildConfig from "../lib/guildconfig.service";
import logService from "../modules/logger.service";
import RavenEvent from "../types/event";

export default class InteractionCreate implements RavenEvent {
    name = "messageDelete";
    once = false;

    async execute(msg: Message): Promise<void> {
        if (!msg.guildId) return;
        if (msg.member?.user.bot) return;
        if (msg.content == "") return;
        const config = GuildConfig.getGuild(msg.guildId);
        if (!config || !config.log_channel || config.banned) return;

        const member = msg.member as GuildMember;
        const avatar = getAvatar(member);

        const embed = failEmbedTemplate();

        embed.setTitle("Message Deleted");
        embed.setDescription(
            `<#${msg.channelId}>\n` + `\`\`\`${msg.content}\`\`\``,
        );
        embed.setFooter({
            text: `${member.user.tag} <@${member.id}>`,
            iconURL: avatar,
        });

        logService.logEvent(embed, msg.guildId);
    }
}
