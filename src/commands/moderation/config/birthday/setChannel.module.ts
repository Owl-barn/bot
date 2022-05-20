import {
    MessageEmbed,
    HexColorString,
    GuildBasedChannel,
    ClientUser,
} from "discord.js";
import { returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

export async function configBirthdaySetChannel(
    msg: RavenInteraction,
): Promise<returnMessage> {
    if (!msg.guildId) throw "no guild??";

    const channel = msg.options.getChannel("birthday_channel") as
        | GuildBasedChannel
        | undefined;

    const failEmbed = new MessageEmbed()
        .setDescription(`I cant assign this role.`)
        .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

    if (channel && !channel.permissionsFor(msg.client.user as ClientUser))
        return { embeds: [failEmbed] };

    await msg.client.db.guilds.update({
        where: { guild_id: msg.guildId },
        data: { birthday_channel: channel?.id || null },
    });

    const embed = new MessageEmbed()
        .setDescription(
            channel
                ? `Successfully set ${channel} as the birthday message channel!`
                : "Birthday channel removed.",
        )
        .setColor(process.env.EMBED_COLOR as HexColorString);

    return { embeds: [embed] };
}
