import { LocalizationMap } from "discord.js";
import { CommandType } from ".";


export type CommandStage =
  "raw" |
  "configured" |
  "processed";

interface BaseCommandInfoFields {
  name: string;
  description: string;

  nameLocalization?: LocalizationMap;
  descriptionLocalization?: LocalizationMap;
}
interface BaseCommandInfoConfigured extends BaseCommandInfoFields {
  type: CommandType;
}

export interface BaseCommandInfoProcessed extends BaseCommandInfoConfigured {
  path: string;
  commandName: string;
}

export type BaseCommandInfoMap = {
  raw: BaseCommandInfoFields;
  configured: BaseCommandInfoConfigured;
  processed: BaseCommandInfoProcessed;
};


export type BaseCommandInfo<Stage extends CommandStage = "processed"> = BaseCommandInfoMap[Stage];
