import { GuildMember, Message, TextChannel, Util } from "discord.js";
import { warningEmbedTemplate } from "../lib/embedTemplate";
import { getAvatar } from "../lib/functions";
import GuildConfig from "../lib/guildconfig.service";
import RavenEvent from "../types/event";

export default class implements RavenEvent {
    name = "messageUpdate";
    once = false;

    async execute(old: Message, current: Message): Promise<void> {
        if (!current.guildId) return;
        if (old.member?.user.bot) return;
        const config = GuildConfig.getGuild(current.guildId);
        if (!config || !config.log_channel || config.banned) return;
        if (old.content == current.content) return;

        const member = current.member as GuildMember;
        const channel = current.guild?.channels.cache.get(
            config.log_channel,
        ) as TextChannel;
        const embed = warningEmbedTemplate();

        embed.setTitle("Message updated");
        embed.setDescription(
            `old:\n` +
                `\`\`\`${Util.escapeMarkdown(old.content)}\`\`\`\n` +
                `current:\n` +
                `\`\`\`${Util.escapeMarkdown(current.content)}\`\`\``,
        );
        embed.setFooter({
            text: `${member.user.tag} <@${member.id}>`,
            iconURL: getAvatar(member),
        });
        channel.send({ embeds: [embed] });
    }
}
