import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";


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

    const buttons: ButtonBuilder[] = [];

    // Generate buttons.
    for (const role of collection.roles) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`selfroleRemove_${role.id}`)
          .setLabel(role.title)
          .setStyle(ButtonStyle.Danger),
      );
    }

    const component =
      new ActionRowBuilder() as ActionRowBuilder<ButtonBuilder>;
    component.setComponents(buttons);

    return {
      embeds: [embed],
      components: [component],
      ephemeral: true,
    };
  }

);
