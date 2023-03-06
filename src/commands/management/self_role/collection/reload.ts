import { ApplicationCommandOptionType } from "discord.js";
import {
  embedTemplate,
  failEmbedTemplate,
} from "../../../../lib/embedTemplate";
import { updateCollection } from "../../../../lib/selfrole";
import { returnMessage, SubCommand } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

module.exports = class extends SubCommand {
  constructor() {
    super({
      name: "reload",
      description: "Resend the collection",

      arguments: [
        {
          type: ApplicationCommandOptionType.String,
          name: "collection",
          description: "What collection to reload.",
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
    const collection = await db.self_role_main.findUnique({
      where: { uuid: collectionId },
      include: { self_role_roles: true },
    });

    if (!collection)
      return {
        embeds: [
          failEmbedTemplate(
            `Collection ${collectionId} does not exist.`,
          ),
        ],
      };

    await updateCollection(collection, msg.client);

    return {
      embeds: [embedTemplate("Successfully reloaded the collection.")],
    };
  }
};
