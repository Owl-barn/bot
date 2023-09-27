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

    const guildInfo = await state.db.guild.findMany({
      include: {
        _count: { select: { commandLogs: true } },
        selfroleCollections: true,
      },
    });

    const output = guilds
      .map((guild) => {
        const db = guildInfo.find((y) => y.id == guild.id);
        const owner = msg.client.users.cache.get(guild.ownerId);
        const info = {
          id: guild.id,
          name: guild.name,
          owner: guild.ownerId + (owner ? ` - ${owner?.displayName}` : ""),
          membercount: guild.memberCount,
          premium: db?.subscriptionTier,
          level: db?.level,
          commandUsage: db?._count.commandLogs,
          selfRoles: db?.selfroleCollections.length,
        };
        return info;
      });

    const attachment = new AttachmentBuilder(
      Buffer.from(JSON.stringify(output, null, 2))
    );
    attachment.setName("info.txt");

    return { files: [attachment] };
  }
);
