import {
  BaseGuildTextChannel,
  InteractionReplyOptions,
  ApplicationCommandOptionType,
} from "discord.js";
import { embedTemplate } from "../../lib/embedTemplate";
import { Command } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";

module.exports = class extends Command {
  constructor() {
    super({
      name: "clear",
      description: "clear chat",
      group: CommandGroup.moderation,

      guildOnly: true,

      arguments: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: "amount",
          description: "how many messages to delete",
          required: true,
        },
      ],

      botPermissions: ["ManageMessages"],

      throttling: {
        duration: 30,
        usages: 3,
      },
    });
  }

  async execute(msg: RavenInteraction): Promise<InteractionReplyOptions> {
    let amount = msg.options.getInteger("amount", true);
    amount = amount <= 100 ? amount : 100;

    (msg.channel as BaseGuildTextChannel).bulkDelete(amount, true);

    const embed = embedTemplate();

    return { embeds: [embed.setDescription(`deleted ${amount} messages`)] };
  }
};
