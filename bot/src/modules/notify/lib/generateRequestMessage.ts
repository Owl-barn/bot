import { embedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { ChatInputCommandInteraction, User, BaseMessageOptions, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import acceptButton from "../components/buttons/accept";
import declineButton from "../components/buttons/decline";

export function generateRequestMessage(
  msg: ChatInputCommandInteraction,
  friendUser: User,
): BaseMessageOptions {
  const friendRequestEmbed = embedTemplate();
  friendRequestEmbed.setTitle("Friend Request");
  friendRequestEmbed.setDescription(
    `${msg.user.username} (${msg.user}) has sent you a friend request!\n` +
    `If you choose to accept they will be notified when you join a voice channel in a mutual server!`,
  );

  const userAvatar = getAvatar(msg.user);
  if (userAvatar) friendRequestEmbed.setThumbnail(userAvatar);

  const component = new ActionRowBuilder() as ActionRowBuilder<ButtonBuilder>;

  component.addComponents(
    new ButtonBuilder()
      .setCustomId(`${acceptButton.info.name}-${msg.user.id}-${friendUser.id}`)
      .setLabel("Accept")
      .setStyle(ButtonStyle.Success),
  );

  component.addComponents(
    new ButtonBuilder()
      .setCustomId(`${declineButton.info.name}-${msg.user.id}-${friendUser.id}`)
      .setLabel("Decline")
      .setStyle(ButtonStyle.Danger),
  );

  return { embeds: [friendRequestEmbed], components: [component] };
}
