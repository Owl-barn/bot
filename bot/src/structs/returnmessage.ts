import { ButtonInteraction, ChatInputCommandInteraction, InteractionReplyOptions } from "discord.js";

export interface ReturnMessage extends ProcessedReturnMessage {
  ephemeral?: boolean;
}

export interface ProcessedReturnMessage extends InteractionReplyOptions {
  callback?: (interaction: ChatInputCommandInteraction | ButtonInteraction) => Promise<ReturnMessage | void>;
}

