import { failEmbedTemplate, successEmbedTemplate } from "../lib/embedTemplate";
import RavenButton from "../types/button";
import { returnMessage } from "../types/Command";
import { RavenButtonInteraction } from "../types/interaction";

export default class implements RavenButton {
  disabled: boolean;
  name = "friend";

  async execute(msg: RavenButtonInteraction): Promise<returnMessage> {
    const [action, user, friend] = msg.customId.split("_");

    if (msg.user.id !== friend) return {};

    const dataExists = await msg.client.db.friendships.findUnique({
      where: {
        user_id_friend_id: {
          user_id: user,
          friend_id: friend,
        },
      },
    });

    // Check if the friend request exists.
    if (!dataExists) {
      const embed = failEmbedTemplate(
        "Could not find this request in the database",
      );
      embed.setTitle("Invalid request");
      await msg.update({
        embeds: [embed],
        components: [],
      });
      return {};
    }

    // Check if the user accepted the request.
    if (action == "accept") {
      await msg.client.db.friendships.update({
        where: {
          user_id_friend_id: {
            user_id: user,
            friend_id: friend,
          },
        },
        data: {
          pending: false,
        },
      });

      const embed = successEmbedTemplate(
        `Successfully accepted <@${user}>'s friend request!`,
      );
      embed.setTitle("Friend Request Accepted");
      const thumbnail = msg.message.embeds[0].thumbnail?.url;
      if (thumbnail) embed.setThumbnail(thumbnail);

      await msg.update({ components: [], embeds: [embed] });

      return {};
    }

    // Check if the user declined the request.
    if (action == "decline") {
      await msg.client.db.friendships.delete({
        where: {
          user_id_friend_id: {
            user_id: user,
            friend_id: friend,
          },
        },
      });

      const embed = failEmbedTemplate(
        `Successfully declined <@${user}>'s friend request!`,
      );
      embed.setTitle("Friend Request declined");
      const thumbnail = msg.message.embeds[0].thumbnail?.url;
      if (thumbnail) embed.setThumbnail(thumbnail);

      await msg.update({ components: [], embeds: [embed] });

      return {};
    }

    return { embeds: [failEmbedTemplate("Invalid action")] };
  }
}
