import { PermissionsString } from "discord.js";
import { BaseCommandInfo, CommandType, Premium, RunFunction, Throttling } from ".";
import { Argument } from "./argument";

export interface SubCommandInfo extends BaseCommandInfo {
  isGlobal?: boolean;
  adminOnly?: boolean;
  premium?: Premium;
  disabled?: boolean;

  arguments?: Argument<string | number>[];

  userPermissions?: PermissionsString[];
  botPermissions?: PermissionsString[];

  throttling: Throttling;
}

export interface SubCommandStruct {
  info: SubCommandInfo;
  run: RunFunction;
}

export function SubCommand(info: SubCommandStruct["info"], run: SubCommandStruct["run"]): SubCommandStruct {
  return {
    info: {
      ...info,
      type: CommandType.Subcommand,
    },
    run,
  };
}
