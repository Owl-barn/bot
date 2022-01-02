import { HexColorString, MessageEmbed } from "discord.js";
import { returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

export async function configBirthdayReset(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "no guild??";

    await msg.client.db.guilds.update({ where: { guild_id: msg.guildId }, data: { birthday_id: null } });

    const embed = new MessageEmbed()
        .setDescription(`Successfully reset and disabled the birthday auto role!`)
        .setColor(process.env.EMBED_COLOR as HexColorString);

    return { embeds: [embed] };
}