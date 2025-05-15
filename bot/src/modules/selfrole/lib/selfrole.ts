import { state } from "@app";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ClientUser,
  ContainerBuilder,
  Message,
  MessageFlags,
  SectionBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
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

export async function updateCollection(collection: selfRoleCollection, createNew = true): Promise<void> {
  const channel = await isValidChannel(collection.channelId);

  let message: Message | null;

  const container = generateContainer(collection);

  async function sendMessage() {
    message = await channel.send({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
      embeds: [],
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
      flags: MessageFlags.IsComponentsV2,
      components: [container],
      embeds: [],
    });
  } else {
    await sendMessage();
  }
}

export function generateContainer(collection: selfRoleCollection): ContainerBuilder {
  let titleContent = "# ";
  if (collection.title) titleContent += collection.title;
  else titleContent += "Select a role";

  if (collection.description) titleContent += `\n${collection.description}`;
  else titleContent += `\nSelect a role from the list below!`;

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder({ content: titleContent }));

  // Add the roles
  for (const role of collection.roles) {
    const buttonComponent = new ButtonBuilder()
      .setCustomId(`${button.info.name}-${role.id}`)
      .setLabel(role.title)
      .setStyle(ButtonStyle.Secondary);

    const section = new SectionBuilder()
      .addTextDisplayComponents(generateRoleSectionText(role))
      .setButtonAccessory(buttonComponent);

    collection.roles.length <= 10 && container.addSeparatorComponents(new SeparatorBuilder());
    container.addSectionComponents(section);
  }


  // Footer
  let footerContent = `-# ${collection.id}`;
  if (!collection.allowMultiple)
    footerContent = `-# *You can only select one role at a time.\n\n` + footerContent;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(footerContent));

  return container;
}

function generateRoleSectionText(role: Selfrole): TextDisplayBuilder[] {
  const textDisplayComponents = [
    // Title
    new TextDisplayBuilder({ content: generateRoleName(role) }),

    // Description
    role.description && new TextDisplayBuilder({ content: role.description }),
  ];

  return textDisplayComponents.filter(Boolean) as TextDisplayBuilder[];
}

function generateRoleName(role: Selfrole) {
  // TODO: Add support for custom emojis
  // const emoji = role.emoji && checkEmojis(role.emoji).unicode[0];
  return `###${role.emoji ? ` ${role.emoji}` : ""} ${role.title}`;
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

export function generateInteractable(
  collection: selfRoleCollection,
  prefix: string,
): ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] {
  if (collection.roles.length == 0) return [];
  else if (collection.roles.length > 5) {
    return generateMenu(collection, prefix);
  } else {
    return generateButtons(collection, prefix, ButtonStyle.Primary);
  }
}

export interface selfRoleCollection extends prisma.SelfroleCollection {
  roles: Selfrole[];
}
