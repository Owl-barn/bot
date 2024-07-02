import { Throttling } from "@structs/access/throttling";
import { PermissionsString } from "discord.js";
import { CommandType, RunFunction } from ".";
import { BaseCommandInfo, CommandStage } from "./basecommand";
import { Argument } from "./argument";
import { Access } from "@structs/access";

export type SubCommandInfo<Stage extends CommandStage> = BaseCommandInfo<Stage> & {
  isGlobal?: boolean;
  adminOnly?: boolean;
  disabled?: boolean;

  arguments?: Argument[];

  userPermissions?: PermissionsString[];
  botPermissions?: PermissionsString[];

  throttling?: Throttling;

  access?: Access;
}

export interface SubCommandStruct<Stage extends CommandStage> {
  info: SubCommandInfo<Stage>;
  run: RunFunction<boolean>;
}

export function SubCommand<I extends SubCommandInfo<"raw">>(
  info: I,
  run: RunFunction<I["isGlobal"] extends true ? false : true>,
): SubCommandStruct<"configured"> {
  return {
    info: {
      ...info,
      type: CommandType.Subcommand,
    },
    run,
  };
}
