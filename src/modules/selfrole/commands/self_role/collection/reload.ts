import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";
import { updateCollection } from "src/modules/selfrole/lib/selfrole";

export default SubCommand(

  // Info
  {
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
  },

  // Execute
  async (msg) => {
    if (!msg.guildId) throw "no guild in self_role_role_add";

    const collectionId = msg.options.getString("collection", true);
    const collection = await state.db.self_role_main.findUnique({
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

    await updateCollection(collection);

    return {
      embeds: [embedTemplate("Successfully reloaded the collection.")],
    };
  }
);
