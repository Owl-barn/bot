import { embedTemplate, failEmbedTemplate } from "../../../lib/embedTemplate";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
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
        if (!msg.guildId) throw "No guildID in remove_birthday??";

        const client = msg.client;

        const embed = embedTemplate();
        const failEmbed = failEmbedTemplate();

        const query = await client.db.birthdays.updateMany({
            where: {
                user_id: msg.user.id,
                guild_id: msg.guildId,
                NOT: { birthday: null },
            },
            data: { birthday: null },
        });

        if (!query || query.count === 0)
            return { embeds: [failEmbed.setDescription("No birthday set")] };

        return {
            embeds: [embed.setDescription("Birthday removed successfully!")],
        };
    }
};
