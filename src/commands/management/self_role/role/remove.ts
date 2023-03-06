import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import {
  embedTemplate,
  failEmbedTemplate,
} from "../../../../lib/embedTemplate";
import { returnMessage, SubCommand } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

module.exports = class extends SubCommand {
  constructor() {
    super({
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
    });
  }

  async execute(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "no guild in self_role_role_add";
    const db = msg.client.db;

    const collectionId = msg.options.getString("collection", true);

    const collection = await db.self_role_main.findFirst({
      where: { uuid: collectionId, guild_id: msg.guildId },
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

    const embed = embedTemplate();

    embed.setTitle(collection.title);
    embed.setDescription("Select a role to remove.");

    const buttons: ButtonBuilder[] = [];

    // Generate buttons.
    for (const role of collection.self_role_roles) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`selfroleRemove_${role.uuid}`)
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
};
