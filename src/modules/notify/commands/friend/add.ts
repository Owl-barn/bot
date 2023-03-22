import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  BaseMessageOptions,
  User,
  ChatInputCommandInteraction,
} from "discord.js";
import { checkFriendLimit } from "../../lib/checkFriendLimit";
import { connectOrCreate } from "@lib/prisma/connectOrCreate";

export default SubCommand(

  // Info
  {
    name: "add",
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

    const isAllowed = await checkFriendLimit(friendUser.id, msg.user.id);

    if (isAllowed !== null) return isAllowed;

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
          "You already have this user in your vc notify list!",
        );
      return { embeds: [response] };
    }

    // Create the request message.
    const requestMessage = makeRequestMsg(msg, friendUser);

    const sentDm = await friendUser.send(requestMessage).catch(() => null);

    // Couldn't send a DM, try to send a message in the channel.
    if (sentDm === null) {

      const error = {
        embeds: [
          failEmbedTemplate(
            "I've no way to reach this user. Please make sure your friend is able to receive DMs from me!",
          ),
        ],
      };
      if (!msg.channel) return error;

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
      `Successfully sent ${friendUser} a request to be added to your vc notify list!`,
    );
    response.setTitle("Friend request sent!");
    const userAvatar = getAvatar(friendUser);
    if (userAvatar) response.setThumbnail(userAvatar);

    return { embeds: [response] };
  }

);

function makeRequestMsg(
  msg: ChatInputCommandInteraction,
  friendUser: User,
): BaseMessageOptions {
  const friendRequestEmbed = embedTemplate();
  friendRequestEmbed.setTitle("Friend Request");
  friendRequestEmbed.setDescription(
    `${msg.user.username} (${msg.user}) has sent you a friend request!\nIf you choose to accept they will be notified when you join a voice channel in a mutual server!`,
  );
  const userAvatar = getAvatar(msg.user);
  if (userAvatar) friendRequestEmbed.setThumbnail(userAvatar);

  const component = new ActionRowBuilder() as ActionRowBuilder<ButtonBuilder>;

  component.addComponents(
    new ButtonBuilder()
      .setCustomId(`friend_accept_${msg.user.id}_${friendUser.id}`)
      .setLabel("Accept")
      .setStyle(ButtonStyle.Success),
  );

  component.addComponents(
    new ButtonBuilder()
      .setCustomId(`friend_decline_${msg.user.id}_${friendUser.id}`)
      .setLabel("Decline")
      .setStyle(ButtonStyle.Danger),
  );

  return { embeds: [friendRequestEmbed], components: [component] };
}
