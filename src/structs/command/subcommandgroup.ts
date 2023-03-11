import { BaseCommandInfo, CommandType } from ".";

export type SubCommandGroupInfo = BaseCommandInfo;
export interface SubCommandGroupStruct {
  info: SubCommandGroupInfo;
}

export function SubCommandGroup(info: SubCommandGroupStruct["info"]): SubCommandGroupStruct {
  return {
    info: { ...info, type: CommandType.SubcommandGroup },
  };
}
