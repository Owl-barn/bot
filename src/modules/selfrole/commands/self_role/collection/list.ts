import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";


export default SubCommand(

  // Info
  {
    name: "list",
    description: "Remove a collection",

    throttling: {
      duration: 60,
      usages: 1,
    },
  },

  // Execute
  async (msg) => {
    if (!msg.guildId) throw "no guild in self_role_collection_list";

    const collections = await state.db.selfroleCollection.findMany({
      where: { guildId: msg.guildId },
      include: { roles: true },
    });

    if (collections.length == 0)
      return {
        embeds: [failEmbedTemplate("There are no self roles set up.")],
      };

    const embed = embedTemplate();
    embed.setTitle("Self Role Collections:");

    for (const collection of collections) {
      let roles = `**id** ${collection.id}\n`;

      if (collection.roles.length !== 0) {
        const roleList = collection.roles
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
);
