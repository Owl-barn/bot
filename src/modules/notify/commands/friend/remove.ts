import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";

export default SubCommand(

  // Info
  {
    name: "remove",
    description: "Add a user to your vc notify list!",

    arguments: [
      {
        type: ApplicationCommandOptionType.User,
        name: "user",
        description:
          "Which user would you like to remove as friend?",
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
    const friendUser = msg.options.getUser("user", true);

    const deleted = await state.db.friendships
      .delete({
        where: {
          user_id_friend_id: {
            user_id: msg.user.id,
            friend_id: friendUser.id,
          },
        },
      })
      .catch(() => null);

    if (!deleted)
      return {
        embeds: [
          failEmbedTemplate("That user is not on your friend list!"),
        ],
      };

    return {
      embeds: [
        embedTemplate(
          `Removed ${friendUser.username} from your friend list`,
        ),
      ],
    };
  }

);
