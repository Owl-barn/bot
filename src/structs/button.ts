import { ButtonInteraction } from "discord.js";
import { ReturnMessage } from "./returnmessage";

export interface Button {
  name: string;
  disabled?: boolean;
  run: (msg: ButtonInteraction) => Promise<ReturnMessage>;
}
