import { EmbedBuilder, HexColorString } from "discord.js";
import { Command, returnMessage } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "remove",
            description: "Remove your birthday from this server",

            throttling: {
                duration: 60,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        if (!msg.guildId) throw "No guildID???";

        const client = msg.client;

        const embed = new EmbedBuilder().setColor(
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

        return {
            embeds: [embed.setDescription("Birthday removed successfully!")],
        };
    }
};
