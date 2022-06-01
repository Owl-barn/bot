import { HexColorString, EmbedBuilder } from "discord.js";
import { returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

export async function configLevelReset(
    msg: RavenInteraction,
): Promise<returnMessage> {
    if (!msg.guildId) throw "no guild??";

    const deleted = await msg.client.db.level.deleteMany({
        where: { guild_id: msg.guildId },
    });

    const embed = new EmbedBuilder()
        .setDescription(`Successfully deleted \`${deleted.count}\` user levels`)
        .setColor(process.env.EMBED_COLOR as HexColorString);

    return { embeds: [embed] };
}
