import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { ApplicationCommandOptionType } from "discord.js";

export default Command(

  // Info
  {
    name: "unban",
    description: "unbans a user",
    group: CommandGroup.moderation,

    guildOnly: true,

    arguments: [
      {
        type: ApplicationCommandOptionType.User,
        name: "user",
        description: "User to ban",
        required: true,
      },
    ],

    botPermissions: ["BanMembers"],

    throttling: {
      duration: 30,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    if (!msg.guild) throw "No guild on ban??";
    const target = msg.options.getUser("user");

    const embed = embedTemplate();
    const failEmbed = failEmbedTemplate();

    if (!target)
      return { embeds: [failEmbed.setDescription("No user provided")] };

    const bannedUser = await msg.guild.bans
      .fetch(target.id)
      .catch(() => null);

    if (!bannedUser)
      return {
        embeds: [failEmbed.setDescription("That user is not banned")],
      };

    await msg.guild.bans.remove(target.id);

    embed.setTitle(`User has been unbanned`);
    embed.setDescription(`<@${target.id}> has been unbanned`);

    return { embeds: [embed] };
  }
);
