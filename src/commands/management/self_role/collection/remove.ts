import { ApplicationCommandOptionType } from "discord.js";
import {
    embedTemplate,
    failEmbedTemplate,
} from "../../../../lib/embedTemplate";
import { isValidChannel } from "../../../../lib/selfrole";
import { returnMessage, SubCommand } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "remove",
            description: "Remove a collection",

            arguments: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "collection",
                    description: "What collection to remove.",
                    required: true,
                },
            ],

            throttling: {
                duration: 60,
                usages: 1,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        if (!msg.guildId) throw "no guild in self_role_role_add";
        const db = msg.client.db;

        const collectionId = msg.options.getString("collection", true);

        const [roles, collection] = await db.$transaction([
            db.self_role_roles.deleteMany({
                where: { main_uuid: collectionId },
            }),
            db.self_role_main.delete({
                where: { uuid: collectionId },
            }),
        ]);

        if (!collection)
            return {
                embeds: [
                    failEmbedTemplate(
                        `Collection ${collectionId} does not exist.`,
                    ),
                ],
            };

        if (collection.message_id) {
            const channel = await isValidChannel(
                collection.channel_id,
                msg.client,
            ).catch(() => null);
            const message = await channel?.messages
                .fetch(collection.message_id)
                .catch(() => null);

            message?.deletable ? await message?.delete() : null;
        }

        const embed = embedTemplate(
            `Successfully removed the collection: \`${collection.title}\`\n` +
                `Removed ${roles.count} roles.`,
        );

        return { embeds: [embed] };
    }
};
