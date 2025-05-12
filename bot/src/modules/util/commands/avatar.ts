import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { contextEverywhere } from "@structs/command/context";
import { ApplicationCommandOptionType, GuildMember, User } from "discord.js";

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
      usages: 5,
    },
  },

  // Execute
  async (msg) => {
    const userArg = msg.options.getUser("user");
    const memberArg = msg.options.getMember("user");
    let isGlobal = msg.options.getBoolean("global") ?? false;

    let avatar: string | undefined;
    let target: User;

    // Other user
    if (memberArg || userArg) {
      // Guild avatar
      if (memberArg?.avatar && !isGlobal) {
        // API guild member
        if (!(memberArg instanceof GuildMember) && userArg) {
          avatar = `https://cdn.discordapp.com/guilds/${msg.guildId}/users/${userArg.id}/avatars/${memberArg.avatar}.webp?size=4096`;
        } else {
          avatar = getAvatar(memberArg);
        }

        // Global avatar
      } else if (userArg?.avatar) {
        isGlobal = true;
        avatar = getAvatar(userArg);
      }

      if (!userArg) throw new Error("memberArg should have a user");
      target = userArg;

      // Self
    } else {
      if (!msg.member?.avatar) isGlobal = true;
      avatar = getAvatar(isGlobal ? msg.user : msg.member || msg.user);
      target = msg.user;
    }

    if (!avatar)
      return { embeds: [failEmbedTemplate("I cannot access that user's avatar")] };

    const embed = embedTemplate()
      .setTitle(`${target.displayName}'s ${isGlobal ? "global" : "server"} avatar`)
      .setImage(avatar);

    return { embeds: [embed] };
  }
);
