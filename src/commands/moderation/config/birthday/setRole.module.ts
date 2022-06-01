import { Role, EmbedBuilder, HexColorString } from "discord.js";
import { returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

export async function configBirthdaySetRole(
    msg: RavenInteraction,
): Promise<returnMessage> {
    if (!msg.guildId) throw "no guild??";

    const role = msg.options.getRole("birthday_role") as Role | undefined;

    const failEmbed = new EmbedBuilder()
        .setDescription(`I cant assign this role.`)
        .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

    if (role && !role.editable) return { embeds: [failEmbed] };

    await msg.client.db.guilds.update({
        where: { guild_id: msg.guildId },
        data: { birthday_role: role?.id || null },
    });

    const embed = new EmbedBuilder()
        .setDescription(
            role
                ? `Successfully set ${role} as the birthday auto role!`
                : "Birthday role removed.",
        )
        .setColor(process.env.EMBED_COLOR as HexColorString);

    return { embeds: [embed] };
}
