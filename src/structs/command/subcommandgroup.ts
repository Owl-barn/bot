import { BaseCommandInfo, CommandType } from ".";

export interface SubCommandGroupStruct {
  info: BaseCommandInfo;
}

export function SubCommandGroup(info: SubCommandGroupStruct["info"]): SubCommandGroupStruct {
  return {
    info: { ...info, type: CommandType.SubcommandGroup },
  };
}
