import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { Friendship } from "@prisma/client";

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
      embed.setDescription("You currently have no friends :(\nYou can add friends with `/friend add`!");
      return { embeds: [embed] };
    }

    embed.setDescription(
      `here you can see who gets alerted when you join vc ("my friends") and who you get alerted for when they join vc ("my alerts")`,
    );

    const formatFriend = (friend: Friendship) => `<@${friend.userId}>` + (friend.isPending ? " (pending)" : "");

    embed.addFields({
      name: "My alerts",
      inline: true,
      value: alerts.length > 0 ?
        alerts.map(formatFriend).join("\n")
        : "You currently have no alerts :(",
    });


    embed.addFields({
      name: "my friends",
      inline: true,
      value: friends.length > 0 ?
        friends.map(formatFriend).join("\n")
        : "You currently have no friends :(",
    });

    return {
      embeds: [embed],
    };
  }

);
