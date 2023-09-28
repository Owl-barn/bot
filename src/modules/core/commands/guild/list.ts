import { state } from "@app";
import { formatGuildInfo } from "@modules/core/lib/formatGuildInfo";
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
        if (!db) return;
        const info = {
          ...formatGuildInfo(guild, db),
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
