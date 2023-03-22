import { Throttling } from "@structs/access/throttling";
import { PermissionsString } from "discord.js";
import { BaseCommandInfo, CommandType, RunFunction } from ".";
import { Argument } from "./argument";
import { Access } from "@structs/access";

export interface SubCommandInfo extends BaseCommandInfo {
  isGlobal?: boolean;
  adminOnly?: boolean;
  disabled?: boolean;

  arguments?: Argument<string | number>[];

  userPermissions?: PermissionsString[];
  botPermissions?: PermissionsString[];

  throttling?: Throttling;

  access?: Access;
}

export interface SubCommandStruct {
  info: SubCommandInfo;
  run: RunFunction<boolean>;
}

export function SubCommand<I extends SubCommandInfo>(info: I, run: RunFunction<I["isGlobal"] extends true ? false : true>): SubCommandStruct {
  return {
    info: {
      ...info,
      type: CommandType.Subcommand,
    },
    run,
  };
}
