import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { contextEverywhere } from "@structs/command/context";
import { ApplicationCommandOptionType } from "discord.js";

export default Command(

  // Info
  {
    name: "avatar",
    description: "View avatar",
    group: CommandGroup.general,

    context: contextEverywhere,
    isGlobal: true,

    arguments: [
      {
        type: ApplicationCommandOptionType.User,
        name: "user",
        description: "Who's avatar to get",
        required: false,
      },
      {
        type: ApplicationCommandOptionType.Boolean,
        name: "global",
        description: "public avatar or server avatar?",
        required: false,
      },
    ],

    throttling: {
      duration: 60,
      usages: 2,
    },
  },

  // Execute
  async (msg) => {
    const userArg = msg.options.getUser("user");
    const memberArg = msg.options.getMember("user");
    const globalArg = msg.options.getBoolean("global") ?? false;

    let target = memberArg || userArg || msg.user;
    const userTarget = userArg || msg.user;

    if (globalArg) {
      target = userArg || msg.user;
    }

    const avatar = getAvatar(target);

    if (!avatar) return { embeds: [failEmbedTemplate("I cannot access that user's avatar")] };

    const embed = embedTemplate()
      .setTitle(`${userTarget.displayName}'s avatar`)
      .setImage(avatar);

    return { embeds: [embed] };
  }
);
