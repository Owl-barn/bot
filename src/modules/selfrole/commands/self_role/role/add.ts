import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType, escapeMarkdown } from "discord.js";
import { updateCollection } from "modules/selfrole/lib/selfrole";

export default SubCommand(

  // Info
  {
    name: "add",
    description: "Add a role to a collection",

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "collection",
        description: "What channel to add the collection to.",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.Role,
        name: "role",
        description: "What role to add to the collection.",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "title",
        description: "What name to give the collection.",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "description",
        description: "What description to give the collection.",
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
    const role = msg.options.getRole("role", true);
    let title = msg.options.getString("title", true);
    let description = msg.options.getString("description", true);
    const collectionId = msg.options.getString("collection", true);

    title = escapeMarkdown(title);
    description = escapeMarkdown(description);

    const collection = await state.db.selfroleCollection
      .findFirst({
        where: {
          OR: [{ id: collectionId }, { title: collectionId }],
          guildId: msg.guildId,
        },
        include: { roles: true },
      })
      .catch(() => null);

    if (!collection)
      return {
        embeds: [
          failEmbedTemplate(
            `Collection \`${collectionId}\` does not exist.`,
          ),
        ],
      };

    const CollectionEntry = await state.db.selfrole
      .create({
        data: {
          title,
          description,
          roleId: role.id,
          collectionId: collection.id,
        },
      });

    collection.roles.push(CollectionEntry);

    await updateCollection(collection);

    const embed = embedTemplate();
    embed.setFooter({ text: collection.id });
    embed.addFields([
      {
        name: "Collection",
        value: `${title}`,
      },
      {
        name: "Roles",
        value: collection.roles
          .map((x) => `- ${x.title} - <@&${x.roleId}>`)
          .join("\n"),
      },
    ]);

    return {
      embeds: [embed],
    };
  }
);
