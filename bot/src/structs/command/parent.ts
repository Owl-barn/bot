import { BaseCommandInfo, CommandGroup, CommandType } from ".";

export interface ParentCommandInfo extends BaseCommandInfo {
  group: CommandGroup;
}

export interface ParentCommandStruct {
  info: ParentCommandInfo;
}


export function ParentCommand(info: ParentCommandStruct["info"]): ParentCommandStruct {
  return {
    info: { ...info, type: CommandType.Parent },
  };
}
