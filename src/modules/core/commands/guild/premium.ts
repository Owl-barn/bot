import registerCommand from "@lib/command.register";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";


export default SubCommand(

  // Info
  {
    name: "premium",
    description: "sets guild premium state",

    arguments: [
      {
        type: ApplicationCommandOptionType.Boolean,
        name: "state",
        description: "premium status",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "guild_id",
        description: "guild id",
        required: true,
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
    const premium = msg.options.getBoolean("state", true);
    const client = msg.client;

    const guild = client.guilds.cache.get(guildID);

    if (!guild) return { content: "Guild not found" };

    const guildData = await state.db.guild.update({
      where: { id: guild.id },
      data: {
        subscribedUser: { connect: { id: msg.user.id } },
        subscriptionTier: 1,
      },
    });

    await registerCommand(guild);
    state.guilds.set(guildData.id, guildData);

    return { content: `${guild.name}'s premium was set to \`${premium}\`` };
  }
);
