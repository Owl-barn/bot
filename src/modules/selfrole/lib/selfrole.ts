import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ClientUser,
  EmbedBuilder,
  Message,
} from "discord.js";
import prisma, { Selfrole } from "@prisma/client";

export async function isValidChannel(channelId: string) {
  const channel = await state.client.channels.fetch(channelId);
  if (!channel) throw "Channel not found";

  if (channel.type !== ChannelType.GuildText)
    throw "Channel is not a text channel";

  const canSend = channel
    .permissionsFor(state.client.user as ClientUser)
    ?.has("SendMessages");

  if (!canSend)
    throw "I do not have permission to send messages in this channel.";

  return channel;
}

export async function updateCollection(collection: selfRoleCollection): Promise<void> {
  const channel = await isValidChannel(collection.channelId);

  let message: Message;

  async function sendMessage() {
    message = await channel.send({
      embeds: generateEmbed(collection),
      components: generateButtons(
        collection,
        "selfrole",
        ButtonStyle.Primary,
      ),
    });
    await state.db.selfroleCollection.update({
      where: { id: collection.id },
      data: { messageId: message.id },
    });
  }

  if (collection.messageId) {
    message = await channel.messages.fetch(collection.messageId);
    if (!message) {
      await sendMessage();
      return;
    }
    message = await message.edit({
      embeds: generateEmbed(collection),
      components: generateButtons(
        collection,
        "selfrole",
        ButtonStyle.Primary,
      ),
    });
  } else {
    await sendMessage();
  }
}

export function generateEmbed(collection: selfRoleCollection): EmbedBuilder[] {
  const embed = embedTemplate()
    .setTitle(collection.title)
    .setDescription(collection.description)
    .setFooter({ text: collection.id });

  for (const role of collection.roles) {
    embed.addFields([{ name: role.title, value: role.description }]);
  }

  return [embed];
}

export function generateButtons(
  collection: selfRoleCollection,
  prefix: string,
  style: ButtonStyle,
): ActionRowBuilder<ButtonBuilder>[] {
  if (collection.roles.length == 0) return [];

  const buttons: ButtonBuilder[] = [];
  for (const role of collection.roles) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`${prefix}_${role.id}`)
        .setLabel(role.title)
        .setStyle(style),
    );
  }

  const component = new ActionRowBuilder() as ActionRowBuilder<ButtonBuilder>;
  component.setComponents(buttons);

  return [component];
}

export interface selfRoleCollection extends prisma.SelfroleCollection {
  roles: Selfrole[];
}
