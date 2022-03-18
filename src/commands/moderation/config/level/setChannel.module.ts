import { HexColorString, MessageEmbed } from "discord.js";
import GuildConfig from "../../../../lib/guildconfig.service";
import { returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

export async function configLevelSetChannel(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "no guild??";
    const channel = msg.options.getChannel("channel");

    const embed = new MessageEmbed()
        .setColor(process.env.EMBED_COLOR as HexColorString);

    channel
        ? embed.setDescription(`Successfully set the level up channel to ${channel}`)
        : embed.setDescription("successfully disabled the level up channel");

    const guild = await msg.client.db.guilds.update({ where: { guild_id: msg.guildId }, data: { level_channel: channel?.id } });
    GuildConfig.updateGuild(guild);

    return { embeds: [embed] };
}