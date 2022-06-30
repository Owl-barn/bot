import {
    embedTemplate,
    failEmbedTemplate,
} from "../../../../lib/embedTemplate";
import { returnMessage, SubCommand } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "list",
            description: "Remove a collection",

            throttling: {
                duration: 60,
                usages: 1,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        if (!msg.guildId) throw "no guild in self_role_collection_list";
        const db = msg.client.db;

        const collections = await db.self_role_main.findMany({
            where: { guild_id: msg.guildId },
            include: { self_role_roles: true },
        });

        if (collections.length == 0)
            return {
                embeds: [failEmbedTemplate("There are no self roles set up.")],
            };

        const embed = embedTemplate();
        embed.setTitle("Self Role Collections:");

        for (const collection of collections) {
            let roles = `**uuid:** ${collection.uuid}\n`;

            if (collection.self_role_roles.length !== 0) {
                const roleList = collection.self_role_roles
                    .map((role) => `- ${role.title}`)
                    .join("\n");
                roles += `Roles:\n\`\`\`${roleList}\`\`\``;
            } else {
                roles += "**Roles:**\nThere are currently no roles added yet.";
            }

            embed.addFields([
                {
                    name: collection.title,
                    value: roles,
                },
            ]);
        }

        return { embeds: [embed] };
    }
};
