import { ApplicationCommandOptionType, Role } from "discord.js";
import { embedTemplate } from "../../../../lib/embedTemplate";
import { Command, returnMessage } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "remove",
            description: "Remove a role reward.",

            args: [
                {
                    type: ApplicationCommandOptionType.Role,
                    name: "role",
                    description: "What role to add as reward.",
                    required: true,
                },
            ],

            throttling: {
                duration: 60,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        if (!msg.guildId) throw "no guild??";
        const role = msg.options.getRole("role", true) as Role;

        await msg.client.db.level_reward.delete({
            where: { role_id: role.id },
        });

        const embed = embedTemplate();
        embed.setDescription(`Successfully removed ${role} as a level reward.`);

        return { embeds: [embed] };
    }
};
