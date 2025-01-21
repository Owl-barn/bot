import { state } from "@app";
import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";

export function getActionButtons() {
  const buttons = [];

  if (state.env.DONATION_URL)
    buttons.push(new ButtonBuilder()
      .setLabel("Subscribe")
      .setStyle(ButtonStyle.Link)
      .setURL(state.env.DONATION_URL));


  if (state.env.SUPPORT_SERVER)
    buttons.push(new ButtonBuilder()
      .setLabel("Support Server")
      .setStyle(ButtonStyle.Link)
      .setURL(state.env.SUPPORT_SERVER));

  const components = buttons.length > 0
    ? [new ActionRowBuilder().setComponents(buttons) as ActionRowBuilder<ButtonBuilder>]
    : [];

  return components;
}
