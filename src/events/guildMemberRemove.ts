import { GuildMember, TextChannel } from "discord.js";
import { failEmbedTemplate } from "../lib/embedTemplate";
import GuildConfig from "../lib/guildconfig.service";
import RavenEvent from "../types/event";

export default class implements RavenEvent {
    name = "guildMemberRemove";
    once = false;

    async execute(member: GuildMember): Promise<void> {
        if (!member.guild.id) return;
        if (member.user.bot) return;
        const config = GuildConfig.getGuild(member.guild.id);
        if (!config) return;
        if (!config.log_channel) return;

        const avatar = member.avatarURL() || member.user.avatarURL();
        const channel = member.guild?.channels.cache.get(config.log_channel) as TextChannel;
        const embed = failEmbedTemplate();

        embed.setTitle("Member Left");
        embed.setDescription(`${member.user.id} left the server.\n${member.user.tag}\n${member}`);
        embed.setFooter({ text: `${member.user.tag} <@${member.id}>`, iconURL: avatar || "" });
        await channel.send({ embeds: [embed] }).catch((e) => { console.log(e); });
    }
}