import { embedTemplate } from "@lib/embedTemplate";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import {
  BaseGuildTextChannel,
  ApplicationCommandOptionType,
} from "discord.js";

export default Command(

  // Info
  {
    name: "purge",
    description: "Delete the last x chat messages.",
    group: CommandGroup.moderation,

    arguments: [
      {
        type: ApplicationCommandOptionType.Integer,
        name: "amount",
        description: "How many messages to delete",
        required: true,
      },
    ],

    botPermissions: ["ManageMessages"],

    throttling: {
      duration: 30,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    let amount = msg.options.getInteger("amount", true);
    amount = amount <= 100 ? amount : 100;

    (msg.channel as BaseGuildTextChannel).bulkDelete(amount, true);

    const embed = embedTemplate();

    return { embeds: [embed.setDescription(`deleted ${amount} messages`)] };
  }

);
