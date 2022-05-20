import { MessageEmbed, HexColorString } from "discord.js";
import { returnMessage } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

export default async function birthdayRemove(
    msg: RavenInteraction,
): Promise<returnMessage> {
    if (!msg.guildId) throw "No guildID???";

    const client = msg.client;

    const embed = new MessageEmbed().setColor(
        process.env.EMBED_COLOR as HexColorString,
    );

    const query = await client.db.birthdays.updateMany({
        where: {
            user_id: msg.user.id,
            guild_id: msg.guildId,
            NOT: { birthday: null },
        },
        data: { birthday: null },
    });

    if (!query || query.count === 0)
        return { embeds: [embed.setDescription("No birthday set")] };

    return { embeds: [embed.setDescription("Birthday removed successfully!")] };
}
