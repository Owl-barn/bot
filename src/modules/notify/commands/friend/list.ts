import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";

export default SubCommand(

  // Info
  {
    name: "list",
    description: "Add a user to your vc notify list!",

    arguments: [
      {
        type: ApplicationCommandOptionType.User,
        name: "user",
        description:
          "Which user do you want to add to your vc notify list?",
        required: true,
      },
    ],

    throttling: {
      duration: 600,
      usages: 5,
    },
  },

  // Execute
  async (msg) => {
    const friends = await state.db.friendship.findMany({
      where: {
        OR: [{ userId: msg.user.id }, { friendId: msg.user.id }],
      },
    });

    const pendingSent = friends.filter(
      (friend) => friend.userId === msg.user.id && friend.isPending,
    );

    const pendingReceived = friends.filter(
      (friend) => friend.friendId === msg.user.id && friend.isPending,
    );

    const friendSelf = friends.filter(
      (friend) => friend.userId === msg.user.id && !friend.isPending,
    );

    const friendOther = friends.filter(
      (friend) => friend.friendId === msg.user.id && !friend.isPending,
    );

    const embed = embedTemplate();
    embed.setTitle("Friend List");

    // Check if the user has no friends.
    if (
      pendingSent.length == 0 &&
      pendingReceived.length == 0 &&
      friendSelf.length == 0 &&
      friendOther.length == 0
    ) {
      embed.setDescription("You currently have no friends :(");
      return { embeds: [embed] };
    }

    embed.setDescription(
      "Here you can see who gets notified when you join a voice channel and the the people you get notified of!",
    );

    if (friendSelf.length > 0) {
      embed.addFields({
        name: "My alerts",
        value: friendSelf
          .map((friend) => `<@${friend.friendId}>`)
          .join("\n"),
        inline: true,
      });
    }

    if (friendOther.length > 0) {
      embed.addFields({
        name: "My friend alerts",
        value: friendOther
          .map((friend) => `<@${friend.userId}>`)
          .join("\n"),
        inline: true,
      });
    }

    if (pendingSent.length > 0) {
      embed.addFields({
        name: "Sent pending requests",
        value: pendingSent
          .map((friend) => `<@${friend.friendId}>`)
          .join("\n"),
        inline: true,
      });
    }

    if (pendingReceived.length > 0) {
      embed.addFields({
        name: "Received pending requests",
        value: pendingReceived
          .map((friend) => `<@${friend.userId}>`)
          .join("\n"),
        inline: true,
      });
    }

    return {
      embeds: [embed],
    };
  }

);
