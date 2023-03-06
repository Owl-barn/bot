import { CommandGroup, CommandType, RunFunction } from ".";
import { SubCommandInfo } from "./subcommand";

export interface CommandInfo extends SubCommandInfo {
  group: CommandGroup;
}

export interface CommandStruct {
  info: CommandInfo;
  run: RunFunction;
}

export function Command(info: CommandStruct["info"], run: CommandStruct["run"]): CommandStruct {
  return {
    info: { ...info, type: CommandType.Default },
    run,
  };
}
