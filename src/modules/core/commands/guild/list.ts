import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { AttachmentBuilder } from "discord.js";

export default SubCommand(

  // Info
  {
    name: "list",
    description: "List all guilds",

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const guilds = msg.client.guilds.cache.sort(
      (x, y) => y.memberCount - x.memberCount,
    );

    const guildInfo = await state.db.guild.findMany();
    const output = guilds
      .map((guild) => {
        const db = guildInfo.find((y) => y.id == guild.id);
        return `id: ${guild.id} Premium: ${db?.subscriptionTier} owner: ${guild.ownerId} membercount: ${guild.memberCount} name: ${guild.name}`;
      })
      .join("\n");

    const attachment = new AttachmentBuilder(Buffer.from(output));
    attachment.setName("info.txt");

    return { files: [attachment] };
  }
);
