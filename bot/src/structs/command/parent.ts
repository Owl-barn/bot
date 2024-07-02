import { CommandGroup, CommandType } from ".";
import { BaseCommandInfo, CommandStage } from "./basecommand";

export type ParentCommandInfo<Stage extends CommandStage> = BaseCommandInfo<Stage> & {
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
