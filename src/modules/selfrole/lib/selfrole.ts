import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import {
  ActionRowBuilder,
  ChannelType,
  ClientUser,
  EmbedBuilder,
  Message,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import prisma, { Selfrole } from "@prisma/client";
import button from "../components/selectmenus/toggle";

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
      components: generateMenu(collection, button.info.name),
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

  // embed.addFields(collection.roles.map((role) =>
  //   ({ name: (role.emoji ? role.emoji : "") + role.title, value: role.description ?? "No description provided" })
  // ));

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
    role.description && option.setDescription(role.description);

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

export interface selfRoleCollection extends prisma.SelfroleCollection {
  roles: Selfrole[];
}
