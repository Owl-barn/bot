import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";
import { isValidChannel } from "modules/selfrole/lib/selfrole";

export default SubCommand(

  // Info
  {
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
  },

  // Execute
  async (msg) => {
    if (!msg.guildId) throw "no guild in self_role_role_add";

    const collectionId = msg.options.getString("collection", true);

    const [roles, collection] = await state.db.$transaction([
      state.db.self_role_roles.deleteMany({
        where: { main_uuid: collectionId },
      }),
      state.db.self_role_main.delete({
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
      const channel = await isValidChannel(collection.channel_id)
        .catch(() => null);

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
);
