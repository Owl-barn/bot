import { GuildMember, Message, TextChannel } from "discord.js";
import { failEmbedTemplate } from "../lib/embedTemplate";
import GuildConfig from "../lib/guildconfig.service";
import RavenEvent from "../types/event";

export default class InteractionCreate implements RavenEvent {
    name = "messageDelete";
    once = false;

    async execute(msg: Message): Promise<void> {
        if (!msg.guildId) return;
        if (msg.member?.user.bot) return;
        const config = GuildConfig.getGuild(msg.guildId);
        if (!config) return;
        if (!config.log_channel) return;

        const member = msg.member as GuildMember;
        const avatar = member.avatarURL() || member.user.avatarURL();
        const channel = msg.guild?.channels.cache.get(config.log_channel) as TextChannel;
        const embed = failEmbedTemplate();

        embed.setTitle("Message Deleted");
        embed.setDescription(msg.content);
        embed.setFooter(`${member.user.username}#${member.user.tag} <@${member.id}>`, avatar || "");
        channel.send({ embeds: [embed] });
    }
}