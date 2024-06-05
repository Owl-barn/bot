import { CommandGroup, CommandType, RunFunction } from ".";
import { CommandStage } from "./basecommand";
import { SubCommandInfo } from "./subcommand";

export type CommandInfo<Stage extends CommandStage> = SubCommandInfo<Stage> & {
  group: CommandGroup;
}

export interface CommandStruct<Stage extends CommandStage> {
  info: CommandInfo<Stage>;
  run: RunFunction<boolean>;
}

export function Command<I extends CommandInfo<"raw">>(
  info: I,
  run: RunFunction<I["isGlobal"] extends true ? false : true>,
): CommandStruct<"configured"> {
  return {
    info: { ...info, type: CommandType.Default },
    run,
  };
}
