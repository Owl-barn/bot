import registerCommand from "@lib/command.register";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";

export default SubCommand(

  // Info
  {
    name: "ban",
    description: "ban a guild",

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "guild_id",
        description: "guild id",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.Boolean,
        name: "state",
        description: "ban status",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.Boolean,
        name: "leave",
        description: "leave guild",
        required: false,
      },
    ],

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const guildID = msg.options.getString("guildId", true);
    const isBanned = msg.options.getBoolean("state", true);
    const leave = msg.options.getBoolean("leave", false);

    const client = msg.client;
    const guild = client.guilds.cache.get(guildID);
    if (!guild) return { content: "Guild not found" };

    const guildData = await state.db.guild.update({
      where: { id: guild.id },
      data: { isBanned },
    });

    if (isBanned) await guild.commands.set([]);
    else await registerCommand(guild);
    state.guilds.set(guildData.id, guildData);

    let left = false;
    if (leave && isBanned) {
      const leaveGuild = await guild.leave();
      if (leaveGuild) left = true;
    }

    return {
      content: `ban state: \`${isBanned ? "true" : "false"}\`\nLeft: \`${left ? "true" : "false"}\`\nName: \`${guild.name}\``,
    };
  }

);
