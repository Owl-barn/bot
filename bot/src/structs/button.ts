import { ButtonInteraction } from "discord.js";
import { ReturnMessage } from "./returnmessage";


export interface ButtonInfo {
  name: string;
  isGlobal?: boolean;
  disabled?: boolean;
}

export interface ButtonStruct {
  info: ButtonInfo;
  run: RunFunction<boolean>;
}

export type RunFunction<G extends boolean> = (interaction: ButtonInteraction<G extends true ? "cached" : undefined | "raw">) => Promise<ReturnMessage>;

export function Button<I extends ButtonInfo>(info: I, run: RunFunction<I["isGlobal"] extends true ? false : true>): ButtonStruct {
  return {
    info: { ...info },
    run,
  };
}
