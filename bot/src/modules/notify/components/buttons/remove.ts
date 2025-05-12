import { failEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { Button } from "@structs/button";
import { localState } from "@modules/notify";

export default Button(

  {
    name: "friend_remove",
    isGlobal: true,
  },

  async (msg) => {
    const [user, friend] = msg.customId.split("-");

    if (msg.user.id !== user) return {};

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
      const embed = failEmbedTemplate("This alert link no longer exists");
      embed.setTitle("Invalid request");
      await msg.update({
        embeds: [embed],
        components: [],
      });
      return {};
    }

    await state.db.friendship.delete({
      where: {
        userId_friendId: {
          userId: user,
          friendId: friend,
        },
      },
    });

    const embed = failEmbedTemplate(`Successfully disabled your alerts for <@${user}>!`);
    embed.setTitle("Alerts disabled");

    const thumbnail = msg.message.embeds[0].thumbnail?.url;
    if (thumbnail) embed.setThumbnail(thumbnail);

    localState.log.info(`Friend alert removed by ${user} for ${friend}`);

    await msg.update({ components: [], embeds: [embed] });

    return {};

  }

);
