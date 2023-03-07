import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { ApplicationCommandOptionType, GuildMember } from "discord.js";

export default Command(

  // Info
  {
    name: "nick",
    description: "changes the nickname for a user",
    group: CommandGroup.moderation,

    guildOnly: true,

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "nickname",
        description: "Nickname to give the user",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.User,
        name: "user",
        description: "User to change the nickname for",
        required: false,
      },
    ],

    botPermissions: ["ManageNicknames", "ChangeNickname"],

    throttling: {
      duration: 30,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const nickname = msg.options.getString("nickname", true);
    let target = msg.options.getMember("user") as GuildMember | null;

    if (!target) target = msg.member as GuildMember;
    if (!target.moderatable) {
      const embed = failEmbedTemplate();
      embed.setDescription("I cant nickname that person");

      return {
        ephemeral: true,
        embeds: [embed],
      };
    }

    await target.setNickname(nickname);

    const embed = embedTemplate();
    embed.setDescription("Nickname changed");

    return { embeds: [embed] };
  }

);
