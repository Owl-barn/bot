import { AnySelectMenuInteraction, SelectMenuType } from "discord.js";
import { ReturnMessage } from "./returnmessage";


export interface SelectMenuInfo {
  name: string;
  type: SelectMenuType;
  isGlobal?: boolean;
  disabled?: boolean;
}

export interface SelectMenuStruct {
  info: SelectMenuInfo;
  run: RunFunction<boolean>;
}

export type RunFunction<G extends boolean> = (interaction: AnySelectMenuInteraction<G extends true ? "cached" : undefined | "raw">) => Promise<ReturnMessage>;

export function SelectMenu<I extends SelectMenuInfo>(info: I, run: RunFunction<I["isGlobal"] extends true ? false : true>): SelectMenuStruct {
  return {
    info: { ...info },
    run,
  };
}
