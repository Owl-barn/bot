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
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import prisma, { Selfrole } from "@prisma/client";
import button from "../components/selectmenus/toggle";
import { checkEmojis } from "@lib/emoji";

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

export async function updateCollection(collection: selfRoleCollection, createNew = true): Promise<void> {
  const channel = await isValidChannel(collection.channelId);

  let message: Message | null;

  async function sendMessage() {
    message = await channel.send({
      embeds: generateEmbed(collection),
      components: generateMenu(collection, button.info.name),
    });
    await state.db.selfroleCollection.update({
      where: { id: collection.id },
      data: { messageId: message.id },
    });
  }

  if (collection.messageId) {
    message = await channel.messages.fetch(collection.messageId).catch(() => null);
    if (!message) {
      if (!createNew) throw "Message not found";
      await sendMessage();
      return;
    }
    message = await message.edit({
      embeds: generateEmbed(collection),
      components: generateMenu(
        collection,
        button.info.name,
      ),
    });
  } else {
    await sendMessage();
  }
}

export function generateEmbed(collection: selfRoleCollection): EmbedBuilder[] {
  const embed = embedTemplate()
    .setFooter({ text: collection.id });

  collection.title && embed.setTitle(collection.title);
  collection.description && embed.setDescription(collection.description);

  embed.addFields(collection.roles.map((role) => {
    let name = role.title;
    if (role.emoji) {
      const emoji = checkEmojis(role.emoji).unicode[0];
      emoji && (name = `${emoji} ${name}`);
    }

    return {
      name,
      value: role.description ?? "No description provided",
      inline: false,
    };
  }));

  return [embed];
}

export function generateMenu(
  collection: selfRoleCollection,
  prefix: string,
): ActionRowBuilder<StringSelectMenuBuilder>[] {
  if (collection.roles.length == 0) return [];


  // Make the menu items
  const options: StringSelectMenuOptionBuilder[] = [];
  for (const role of collection.roles) {
    const option = new StringSelectMenuOptionBuilder()
      .setLabel(role.title)
      .setValue(role.id);

    role.emoji && option.setEmoji(role.emoji);
    role.description && option.setDescription(role.description.substring(0, 99));

    options.push(option);
  }

  // build the menu
  const menu = new StringSelectMenuBuilder()
    .setCustomId(prefix)
    .setPlaceholder("Select a role!")
    .addOptions(options);


  const component = new ActionRowBuilder() as ActionRowBuilder<StringSelectMenuBuilder>;
  component.setComponents(menu);

  return [component];
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
        .setCustomId(`${prefix}-${role.id}`)
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
