import { ImageURLOptions } from "@discordjs/rest";
import { embedTemplate } from "@lib/embedTemplate";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { GuildMember, ApplicationCommandOptionType } from "discord.js";

export default Command(

  // Info
  {
    name: "avatar",
    description: "View avatar",
    group: CommandGroup.general,

    guildOnly: true,

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
    const settings: ImageURLOptions = {
      size: 4096,
      extension: "png",
    };

    const user = msg.options.getMember("user") as GuildMember | null;
    const global = msg.options.getBoolean("global") ?? false;
    const member = user || (msg.member as GuildMember);
    let avatar;

    if (global) avatar = member.user.avatarURL(settings);
    else
      avatar = member?.avatarURL(settings) || member.user.avatarURL(settings);

    if (!avatar) throw "no avatar??";

    const embed = embedTemplate()
      .setTitle(`${member.user.username}'s avatar`)
      .setImage(avatar);

    return { embeds: [embed] };
  }
);
