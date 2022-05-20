import { GuildMember, Message, TextChannel } from "discord.js";
import { warningEmbedTemplate } from "../lib/embedTemplate";
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
        const avatar = member.avatarURL() || member.user.avatarURL();
        const channel = current.guild?.channels.cache.get(
            config.log_channel,
        ) as TextChannel;
        const embed = warningEmbedTemplate();

        embed.setTitle("Message updated");
        embed.setDescription(
            `old:\n` +
                `\`\`\`${old.content}\`\`\`\n` +
                `current:\n` +
                `\`\`\`${current.content}\`\`\``,
        );
        embed.setFooter({
            text: `${member.user.tag} <@${member.id}>`,
            iconURL: avatar || "",
        });
        channel.send({ embeds: [embed] });
    }
}
