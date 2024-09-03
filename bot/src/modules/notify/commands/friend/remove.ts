import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";

export default SubCommand(

  // Info
  {
    name: "remove",
    description: "Remove a user from your vc notify list",

    isGlobal: true,

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "type",
        description: "Do you want to remove your own or your friend's alert?",
        required: true,
        choices: [
          {
            name: "My alert",
            value: "alert",
          },
          {
            name: "My friend's alert",
            value: "friend",
          },
        ],
      },
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
    const type = msg.options.getString("type", true) as "friend" | "alert";
    const friendUser = msg.options.getUser("user", true);

    const deleted = await state.db.friendship
      .delete({
        where: {
          userId_friendId: type === "alert" ?
            {
              userId: msg.user.id,
              friendId: friendUser.id,
            } :
            {
              userId: friendUser.id,
              friendId: msg.user.id,
            },
        },
      })
      .catch(() => null);


    if (!deleted)
      return {
        embeds: [
          failEmbedTemplate(`That user is not on your ${type} list!`),
        ],
      };

    return {
      embeds: [
        embedTemplate(`Successfully removed ${friendUser.username} from your ${type} list`),
      ],
    };
  }

);
