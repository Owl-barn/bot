import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";

export default SubCommand(

  // Info
  {
    name: "list",
    description: "Add a user to your VC alerts!",

    throttling: {
      duration: 600,
      usages: 5,
    },
  },

  // Execute
  async (msg) => {
    const data = await state.db.friendship.findMany({
      where: {
        OR: [{ userId: msg.user.id }, { friendId: msg.user.id }],
      },
    });

    const friends = data.filter((friend) => friend.friendId === msg.user.id);
    const alerts = data.filter((friend) => friend.userId === msg.user.id);

    const embed = embedTemplate();
    embed.setTitle("Friend List");

    // Check if the user has no friends.
    if (friends.length == 0 && alerts.length == 0) {
      embed.setDescription("You currently have no friends :(");
      return { embeds: [embed] };
    }

    embed.setDescription(
      "Here you can see who gets notified when you join a voice channel and the the people you get notified of!",
    );

    if (alerts.length > 0) {
      embed.addFields({
        name: "My alerts",
        inline: true,
        value: alerts
          .map((friend) =>
            (`<@${friend.friendId}>` + (friend.isPending ? " (pending)" : "")))
          .join("\n"),
      });
    }

    if (friends.length > 0) {
      embed.addFields({
        name: "my friends",
        inline: true,
        value: friends
          .map((friend) =>
            (`<@${friend.userId}>` + (friend.isPending ? " (pending)" : "")))
          .join("\n"),
      });
    }

    return {
      embeds: [embed],
    };
  }

);
