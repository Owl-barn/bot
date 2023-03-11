import { embedTemplate } from "@lib/embedTemplate";
import { self_role_main, self_role_roles } from "@prisma/client";
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

export async function isValidChannel(channel_id: string) {
  const channel = await state.client.channels.fetch(channel_id);
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
  const channel = await isValidChannel(collection.channel_id);

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
    await state.db.self_role_main.update({
      where: { uuid: collection.uuid },
      data: { message_id: message.id },
    });
  }

  if (collection.message_id) {
    message = await channel.messages.fetch(collection.message_id);
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
    .setFooter({ text: collection.uuid });

  for (const role of collection.self_role_roles) {
    embed.addFields([{ name: role.title, value: role.description }]);
  }

  return [embed];
}

export function generateButtons(
  collection: selfRoleCollection,
  prefix: string,
  style: ButtonStyle,
): ActionRowBuilder<ButtonBuilder>[] {
  if (collection.self_role_roles.length == 0) return [];

  const buttons: ButtonBuilder[] = [];
  for (const role of collection.self_role_roles) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`${prefix}_${role.uuid}`)
        .setLabel(role.title)
        .setStyle(style),
    );
  }

  const component = new ActionRowBuilder() as ActionRowBuilder<ButtonBuilder>;
  component.setComponents(buttons);

  return [component];
}

export interface selfRoleCollection extends self_role_main {
  self_role_roles: self_role_roles[];
}
