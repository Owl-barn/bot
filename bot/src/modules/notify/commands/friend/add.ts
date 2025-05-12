import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ComponentBuilder } from "discord.js";
import { checkFriendLimit } from "../../lib/checkFriendLimit";
import { connectOrCreate } from "@lib/prisma/connectOrCreate";
import { generateRequestMessage } from "modules/notify/lib/generateRequestMessage";
import { localState } from "@modules/notify";

export default SubCommand(

  // Info
  {
    name: "add",
    description: "Add a user to your vc notify list",

    isGlobal: true,

    arguments: [
      {
        type: ApplicationCommandOptionType.User,
        name: "user",
        description: "Which user do you want to add to your VC alerts?",
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

    // Check if not self.
    if (friendUser.id === msg.user.id) {
      return {
        embeds: [
          failEmbedTemplate("You can't add yourself as friend :("),
        ],
      };
    }

    // Check if bot.
    if (friendUser.bot) {
      return {
        embeds: [
          failEmbedTemplate("Robots aren't capable of friendship 🤖"),
        ],
      };
    }

    await msg.deferReply();

    const isAllowed = await checkFriendLimit(friendUser.id, msg.user.id);

    if (isAllowed.error !== undefined)
      return { embeds: [failEmbedTemplate(isAllowed.error)] };

    // Check if the user is already in the list.
    const exists = await state.db.friendship.findUnique({
      where: {
        userId_friendId: {
          userId: msg.user.id,
          friendId: friendUser.id,
        },
      },
    });

    if (exists) {
      const response = exists.isPending
        ? failEmbedTemplate(
          "You already have a pending friend request to this user!",
        )
        : failEmbedTemplate(
          "You already have this user on your VC alerts!",
        );
      return { embeds: [response] };
    }

    // Create the request message.
    const requestMessage = generateRequestMessage(msg, friendUser);

    const sentDm = await friendUser
      .send(requestMessage)
      .catch((error) => {
        localState.log.debug("Failed to send notify request DM to user", { error });
        return null;
      });

    // Couldn't send a DM, try to send a message in the channel.
    if (sentDm === null) {

      const error = {
        embeds: [failEmbedTemplate("I've no way to reach this user. Please make sure your friend is able to receive DMs from me!")],
      };

      if (!msg.channel || msg.channel.isDMBased()) return error;

      const sentChannelMsg = await msg.channel
        .send({ ...requestMessage, content: `${friendUser}` })
        .catch(() => null);

      if (sentChannelMsg === null) return error;
    }

    // Create the request in the database.
    await state.db.friendship.create({
      data: {
        isPending: true,
        user: connectOrCreate(msg.user.id),
        friend: connectOrCreate(friendUser.id),
      },
    });

    const response = embedTemplate(
      `Successfully sent ${friendUser} a request to be added to your VC alerts!\n`
    );

    response.addFields([
      {
        name: "Capacity",
        value: `You have used ${isAllowed.friendCount + 1}/${state.env.VOICE_NOTIFY_ALERT_LIMIT} alert slots!`,
      },
      {
        name: "Disclaimer",
        value: `this will only alert you when they join a voice channel, and not the other way around!`,
      },
      {
        name: "Tip",
        value: `To ensure you can receive alerts make sure to add the bot to your apps with the button below!`,
      }
    ]);

    const button = new ActionRowBuilder<ButtonBuilder>()
      .setComponents(
        new ButtonBuilder()
          .setURL(`https://discord.com/oauth2/authorize?client_id=${state.client.user!.id}`)
          .setLabel("Add bot")
          .setStyle(ButtonStyle.Link)
      );


    response.setTitle("Friend request sent!");

    const userAvatar = getAvatar(friendUser);
    if (userAvatar) response.setThumbnail(userAvatar);

    return { embeds: [response], components: [button] };
  }

);
