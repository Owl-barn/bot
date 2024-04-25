import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import {
  ApplicationCommandOptionType,
} from "discord.js";
import button from "@modules/selfrole/components/buttons/remove";
import { collectionAutocomplete } from "@modules/selfrole/lib/collectionAutocomplete";
import { generateInteractable } from "@modules/selfrole/lib/selfrole";

export default SubCommand(

  // Info
  {
    name: "remove",
    description: "Remove a selfrole",

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "collection",
        description: "From which collection.",
        autoComplete: collectionAutocomplete,
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
    const collectionId = msg.options.getString("collection", true);

    const collection = await state.db.selfroleCollection.findFirst({
      where: { id: collectionId, guildId: msg.guildId },
      include: { roles: true },
    });

    if (!collection)
      return {
        embeds: [
          failEmbedTemplate(
            `Collection ${collectionId} does not exist.`,
          ),
        ],
      };

    const embed = embedTemplate();

    embed.setTitle(collection.title);
    embed.setDescription("Select a role to remove.");

    const components = generateInteractable(collection, button.info.name);

    return {
      embeds: [embed],
      components,
      ephemeral: true,
    };
  }

);
