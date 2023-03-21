import { CommandGroup, CommandType, RunFunction } from ".";
import { SubCommandInfo } from "./subcommand";

export interface CommandInfo extends SubCommandInfo {
  group: CommandGroup;
}

export interface CommandStruct {
  info: CommandInfo;
  run: RunFunction<boolean>;
}

export function Command<I extends CommandInfo>(info: I, run: RunFunction<I["isGlobal"] extends true ? false : true>): CommandStruct {
  return {
    info: { ...info, type: CommandType.Default },
    run,
  };
}
