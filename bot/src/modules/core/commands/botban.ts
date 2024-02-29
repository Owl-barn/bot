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
    const isBanned = msg.options.getBoolean("state", true);

    if (!target.match(/[0-9]{17,19}/))
      return { content: "Invalid user ID" };

    await state.db.user.upsert({
      where: { id: target },
      create: {
        id: target,
        isBanned,
      },
      update: {
        isBanned,
      },
    });

    if (isBanned) state.bannedUsers.set(target, "");
    else state.bannedUsers.delete(target);

    state.log.info(
      `User ${target} has been ${isBanned ? "banned" : "unbanned"}, now ${state.bannedUsers.size} banned users`,
    );


    const response = embedTemplate();
    response.setDescription(
      `Successfully ${isBanned ? "banned" : "unbanned"} <@${target}>`,
    );

    return { embeds: [response] };
  },

);
