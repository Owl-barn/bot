import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { ApplicationCommandOptionType } from "discord.js";

export default Command(

  // Info
  {
    name: "botban",
    description: "bans a user from using the bot",
    group: CommandGroup.owner,

    guildOnly: false,

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "target",
        description: "User ID of the user to ban",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.Boolean,
        name: "state",
        description: "Whether to ban or unban the user",
        required: true,
      },
    ],

    throttling: {
      duration: 10,
      usages: 10,
    },
  },

  async (msg) => {
    const target = msg.options.getString("target", true);
    const banned = msg.options.getBoolean("state", true);

    if (!target.match(/[0-9]{17,19}/))
      return { content: "Invalid user ID" };

    if (banned) {
      await state.db.banned_user.create({ data: { user_id: target } });
      state.bannedUsers.set(target, "");
    } else {
      await state.db.banned_user.delete({ where: { user_id: target } });
      state.bannedUsers.delete(target);
    }


    const response = embedTemplate();
    response.setDescription(
      `Successfully ${banned ? "banned" : "unbanned"} <@${target}>`,
    );

    return { embeds: [response] };
  },

);
