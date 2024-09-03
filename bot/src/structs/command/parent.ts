import { CommandGroup, CommandType } from ".";
import { BaseCommandInfo, CommandStage } from "./basecommand";
import { CommandContext } from "./context";

export type ParentCommandInfo<Stage extends CommandStage> = BaseCommandInfo<Stage> & {
  context?: CommandContext;
  group: CommandGroup;
}

export interface ParentCommandStruct<Stage extends CommandStage> {
  info: ParentCommandInfo<Stage>;
}


export function ParentCommand(info: ParentCommandStruct<"raw">["info"]): ParentCommandStruct<"configured"> {
  return {
    info: {
      ...info,
      type: CommandType.Parent,
    },
  };
}
