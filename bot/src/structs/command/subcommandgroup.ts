import { CommandType } from ".";
import { BaseCommandInfo, CommandStage } from "./basecommand";

export type SubCommandGroupInfo<Stage extends CommandStage> = BaseCommandInfo<Stage>;

export interface SubCommandGroupStruct<Stage extends CommandStage> {
  info: SubCommandGroupInfo<Stage>;
}

export function SubCommandGroup(info: SubCommandGroupStruct<"raw">["info"]): SubCommandGroupStruct<"configured"> {
  return {
    info: {
      ...info,
      type: CommandType.SubcommandGroup,
    },
  };
}
