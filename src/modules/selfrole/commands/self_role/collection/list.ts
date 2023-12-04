import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";


export default SubCommand(

  // Info
  {
    name: "list",
    description: "Show all selfrole collections",

    throttling: {
      duration: 60,
      usages: 1,
    },
  },

  // Execute
  async (msg) => {
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
      let roles = `\`${collection.id}\`\n`;

      if (collection.roles.length !== 0) {
        const roleList = collection.roles
          .map((role) => `-${role.emoji ?? ""}${role.title}`)
          .join("\n");
        roles += `\`\`\`${roleList}\`\`\``;
      } else {
        roles += "There are currently no roles added yet.";
      }

      embed.addFields([
        {
          name: collection.title ?? "No title provided",
          value: roles,
        },
      ]);
    }

    return { embeds: [embed] };
  }
);
