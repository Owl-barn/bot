import { embedTemplate } from "../../../../lib/embedTemplate";
import { Command, returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "reset",
            description: "Reset all role rewards.",

            userPermissions: ["Administrator"],

            throttling: {
                duration: 60,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        if (!msg.guildId) throw "no guild??";

        const deleted = await msg.client.db.level_reward.deleteMany({
            where: { guild_id: msg.guildId },
        });

        const embed = embedTemplate();
        embed.setDescription(
            `Successfully removed ${deleted.count} level rewards.`,
        );

        return { embeds: [embed] };
    }
};
