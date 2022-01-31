import { HexColorString, MessageEmbed } from "discord.js";
import { returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

export async function configBirthdayResetUser(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "no guild??";
    const user = msg.options.getUser("birthday_user", true);

    await msg.client.db.birthdays.delete({ where: { user_id_guild_id: { guild_id: msg.guildId, user_id: user.id } } });

    const embed = new MessageEmbed()
        .setDescription(`Successfully reset <@${user.id}>'s birthday`)
        .setColor(process.env.EMBED_COLOR as HexColorString);

    return { embeds: [embed] };
}