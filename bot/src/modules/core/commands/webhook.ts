import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { ApplicationCommandOptionType, WebhookClient } from "discord.js";

export default Command(
  // Info
  {
    name: "webhook",
    description: "deletes webhook",
    group: CommandGroup.owner,

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "webhook",
        description: "webhook URL",
        required: true,
      },
    ],

    throttling: {
      duration: 10,
      usages: 2,
    },
  },


  // Execute
  async (msg) => {
    const url = msg.options.getString("webhook") as string;

    const webhookClient = new WebhookClient({ url });

    const deleted = await webhookClient
      .delete()
      .catch(() => false)
      .then(() => true);

    if (!deleted) return { content: "Failed" };
    return { content: "Webhook succesfully deleted" };
  }
);
