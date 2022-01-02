import { Role, MessageEmbed, HexColorString } from "discord.js";
import { returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

export async function configBirthdaySet(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "no guild??";

    const birthdayRole = msg.options.getRole("birthday_role", true) as Role;

    const failEmbed = new MessageEmbed()
        .setDescription(`I cant assign this role.`)
        .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

    if (!birthdayRole.editable) return { embeds: [failEmbed] };

    await msg.client.db.guilds.update({ where: { guild_id: msg.guildId }, data: { birthday_id: birthdayRole.id } });

    const embed = new MessageEmbed()
        .setDescription(`Successfully set ${birthdayRole} as the birthday auto role!`)
        .setColor(process.env.EMBED_COLOR as HexColorString);

    return { embeds: [embed] };
}