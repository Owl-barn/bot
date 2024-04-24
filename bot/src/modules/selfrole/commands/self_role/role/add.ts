import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType, escapeMarkdown } from "discord.js";
import { updateCollection } from "modules/selfrole/lib/selfrole";
import { checkEmojis } from "@lib/emoji";
import { collectionAutocomplete } from "@modules/selfrole/lib/collectionAutocomplete";

export default SubCommand(

  // Info
  {
    name: "add",
    description: "Add a role to a collection",

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "collection",
        description: "What channel to add the role to.",
        autoComplete: collectionAutocomplete,
        required: true,
      },
      {
        type: ApplicationCommandOptionType.Role,
        name: "role",
        description: "What role to add to the role.",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "title",
        description: "What name to give the role.",
        required: false,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "emoji",
        description: "What emoji to assign the role.",
        required: false,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "description",
        description: "What description to give the role.",
        required: false,
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
    let title = msg.options.getString("title", false);
    let emoji = msg.options.getString("emoji", false);
    let description = msg.options.getString("description", false);
    const collectionId = msg.options.getString("collection", true);

    title = title ?? role.name;
    title = escapeMarkdown(title);
    description = description && escapeMarkdown(description);

    if (emoji) {
      const emojis = checkEmojis(emoji);
      if (emojis.custom[0]) emoji = emojis.custom[0][3];
      else if (emojis.unicode[0]) emoji = emojis.unicode[0];
      else emoji = null;
    }

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

    if (collection.roles.find((x) => x.roleId == role.id)) {
      return {
        embeds: [
          failEmbedTemplate(
            `Role \`${role.name}\` is already in collection \`${collection.title}\`.`,
          ),
        ],
      };
    }

    const CollectionEntry = await state.db.selfrole
      .create({
        data: {
          title,
          emoji,
          description,
          roleId: role.id,
          collectionId: collection.id,
        },
      });

    collection.roles.push(CollectionEntry);

    const fail = await updateCollection(collection).catch(() => true);

    if (fail)
      return {
        embeds: [
          failEmbedTemplate(
            `Failed update collection, but role \`${role.name}\` was added to collection \`${collection.title}\`.`,
          ),
        ],
      };

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
