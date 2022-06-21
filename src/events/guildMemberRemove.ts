import { rcon } from "@prisma/client";
import { GuildMember, TextChannel } from "discord.js";
import { failEmbedTemplate } from "../lib/embedTemplate";
import { getAvatar } from "../lib/functions";
import GuildConfig, { GuildConfigs } from "../lib/guildconfig.service";
import { getMcName, RCONHandler } from "../lib/mc.service";
import RavenEvent from "../types/event";
import RavenClient from "../types/ravenClient";

export default class implements RavenEvent {
    name = "guildMemberRemove";
    once = false;

    async execute(member: GuildMember): Promise<void> {
        if (!member.guild.id) return;
        if (member.user.bot) return;
        const config = GuildConfig.getGuild(member.guild.id);
        if (!config) return;
        if (config.banned) return;
        if (config.log_channel) logLeave(member, config);
        if (config.rcon) await whitelistLeave(member, config.rcon);
    }
}

async function logLeave(member: GuildMember, config: GuildConfigs) {
    const avatar = getAvatar(member);
    const channel = member.guild?.channels.cache.get(
        config.log_channel as string,
    ) as TextChannel;
    const embed = failEmbedTemplate();

    embed.setTitle("Member Left");
    embed.setDescription(
        `${member.user.id} left the server.\n${member.user.tag}\n${member}`,
    );
    embed.setFooter({
        text: `${member.user.tag} <@${member.id}>`,
        iconURL: avatar,
    });
    await channel.send({ embeds: [embed] }).catch((e) => {
        console.log(e);
    });
}

async function whitelistLeave(member: GuildMember, config: rcon) {
    const whitelist = await (member.client as RavenClient).db.whitelist
        .delete({
            where: {
                whitelist_guild_user_un: {
                    guild_id: member.guild.id,
                    user_id: member.id,
                },
            },
        })
        .catch(() => null);

    console.log({ whitelist });
    if (!whitelist) return;
    const mcName = getMcName(whitelist.mc_uuid).catch(() => null);
    console.log({ mcName });
    if (!mcName) return;
    const result = await RCONHandler(
        [`whitelist remove ${mcName}`],
        config,
    ).catch(() => null);
    console.log({ result });
    if (!result) console.log(`Failed to remove ${member.id} from whitelist`);
    else console.log(`Removed ${member.id} from whitelist`);
}
