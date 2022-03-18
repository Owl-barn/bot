import { HexColorString, MessageEmbed } from "discord.js";
import GuildConfig from "../../../../lib/guildconfig.service";
import { returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

export async function configLevelToggle(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "no guild??";
    const state = msg.options.getBoolean("state", true);

    const guild = await msg.client.db.guilds.update({ where: { guild_id: msg.guildId }, data: { level: state } });
    GuildConfig.updateGuild(guild);

    const embed = new MessageEmbed()
        .setDescription(`Successfully toggled the level system, it is now \`${state ? "on" : "off"}\``)
        .setColor(process.env.EMBED_COLOR as HexColorString);

    return { embeds: [embed] };
}