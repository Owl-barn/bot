import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";
import { localState } from "../..";

const controller = localState.controller;

SubCommand(

  // Info
  {
    name: "terminate",
    description: "terminate all the owlets",

    arguments: [
      {
        type: ApplicationCommandOptionType.User,
        name: "owlet",
        description: "the owlet to terminate",
        required: false,
      },
      {
        type: ApplicationCommandOptionType.Boolean,
        name: "now",
        description: "Shutdown instantly?",
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
    const owlet = msg.options.getUser("owlet");
    const now = msg.options.getBoolean("now") ?? false;

    // If owlet is specified then terminate that owlet.
    if (owlet) {
      const bot = controller.getOwletById(owlet.id);
      if (!bot) return { content: "no bot found" };
      bot.terminate(now);
      return { content: `terminated <@${owlet.id}>` };
    }

    // If no owlet is specified, terminate all owlets.
    const count = controller.terminate(now);
    return { content: `Terminated all ${count} owlets` };
  }

);
