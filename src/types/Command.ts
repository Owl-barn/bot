import {
  InteractionReplyOptions,
  LocalizationMap,
  PermissionsString,
} from "discord.js";
import { Argument } from "./argument";
import { CommandGroup } from "./commandGroup";
import RavenInteraction from "./interaction";

export type CommandEnum =
    | ParentCommand
    | SubCommandGroup
    | SubCommand
    | Command;

/**
 * @class Base Command.
 */
export abstract class BaseCommand {
  public constructor(info: BaseCommandInfo) {
    Object.assign(this, info);
  }

  public name!: string;
  public description!: string;
  public type!: CommandType;

  public nameLocalization?: LocalizationMap;
  public descriptionLocalization?: LocalizationMap;

  public path?: string;
}

export interface BaseCommandInfo {
  type?: CommandType;

  name: string;
  description: string;

  nameLocalization?: LocalizationMap;
  descriptionLocalization?: LocalizationMap;

  path?: string;
}

/**
 * @class Parent Command.
 * @extends Base Command.
 */
export abstract class ParentCommand extends BaseCommand {
  public constructor(info: ParentCommandInfo) {
    super(info);
  }
  public type = CommandType.Parent;

  public group!: CommandGroup;
  public premium = false;
}

export interface ParentCommandInfo extends BaseCommandInfo {
  type?: CommandType.Parent;

  group: CommandGroup;
  premium?: boolean;
}

/**
 * @class SubCommandGroup class.
 */
export abstract class SubCommandGroup extends BaseCommand {
  public constructor(info: BaseCommandInfo) {
    super(info);
  }
  public type = CommandType.SubcommandGroup;
}

export interface SubCommandGroupInfo extends BaseCommandInfo {
  type?: CommandType.SubcommandGroup;
}

/**
 * @class Command class.
 */
export abstract class Command extends BaseCommand {
  public constructor(info: CommandInfo) {
    super(info);
  }

  public type = CommandType.Default;

  public group!: CommandGroup;

  public guildOnly: boolean;
  public adminOnly: boolean;
  public premium: boolean;
  public disabled: boolean;

  public arguments?: Argument<string | number>[];

  public userPermissions?: PermissionsString[];
  public botPermissions?: PermissionsString[];

  public throttling!: Throttling;

  abstract execute(interaction: RavenInteraction): Promise<returnMessage>;
}

export interface CommandInfo extends BaseCommandInfo {
  type?: CommandType.Default;

  group: CommandGroup;

  guildOnly?: boolean;
  adminOnly?: boolean;
  premium?: boolean;
  disabled?: boolean;

  arguments?: Argument<string | number>[];

  userPermissions?: PermissionsString[];
  botPermissions?: PermissionsString[];

  throttling: Throttling;
}

/**
 * @class SubCommand class.
 */
export abstract class SubCommand extends BaseCommand {
  public constructor(info: SubCommandInfo) {
    super(info);
  }

  public type = CommandType.Subcommand;

  public guildOnly: boolean;
  public adminOnly: boolean;
  public premium: boolean;
  public disabled: boolean;

  public arguments?: Argument<string | number>[];

  public userPermissions?: PermissionsString[];
  public botPermissions?: PermissionsString[];

  public throttling!: Throttling;

  abstract execute(interaction: RavenInteraction): Promise<returnMessage>;
}

export interface SubCommandInfo extends BaseCommandInfo {
  type?: CommandType.Subcommand;

  guildOnly?: boolean;
  adminOnly?: boolean;
  premium?: boolean;
  disabled?: boolean;

  arguments?: Argument<string | number>[];

  userPermissions?: PermissionsString[];
  botPermissions?: PermissionsString[];

  throttling: Throttling;
}

// eslint-disable-next-line no-shadow
export enum CommandType {
  Parent = "Parent",
  SubcommandGroup = "SubcommandGroup",
  Subcommand = "Subcommand",
  Default = "Default",
}

export interface Throttling {
  duration: number;
  usages: number;
}

export interface Permissions {
  test: string;
}

export interface returnMessage extends InteractionReplyOptions {
  callback?: (interaction: RavenInteraction) => Promise<returnMessage | void>;
}
