import { ButtonInteraction, ChatInputCommandInteraction, InteractionReplyOptions } from "discord.js";

export interface ReturnMessage extends InteractionReplyOptions {
  callback?: (interaction: ChatInputCommandInteraction | ButtonInteraction) => Promise<ReturnMessage | void>;
}
