import { failEmbedTemplate, successEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { Button } from "@structs/button";
import { localState } from "@modules/notify";

export default Button(
  {
    name: "friend_accept",
    isGlobal: true,
  },

  async (msg) => {
    const [user, friend] = msg.customId.split("-");

    if (msg.user.id !== friend) return {};

    const dataExists = await state.db.friendship.findUnique({
      where: {
        userId_friendId: {
          userId: user,
          friendId: friend,
        },
      },
    });

    // Check if the friend request exists.
    if (!dataExists) {
      const embed = failEmbedTemplate("Could not find this request in the database");
      embed.setTitle("Invalid request");
      await msg.update({
        embeds: [embed],
        components: [],
      });
      return {};
    }

    await state.db.friendship.update({
      where: {
        userId_friendId: {
          userId: user,
          friendId: friend,
        },
      },
      data: {
        isPending: false,
      },
    });

    const embed = successEmbedTemplate(`Successfully accepted <@${user}>'s friend request!`);
    embed.setTitle("Friend Request Accepted");

    const thumbnail = msg.message.embeds[0].thumbnail?.url;
    if (thumbnail) embed.setThumbnail(thumbnail);

    localState.log.info(`Friend request accepted by ${friend} for ${user}`);

    await msg.update({ components: [], embeds: [embed] });
    return {};
  }

);
