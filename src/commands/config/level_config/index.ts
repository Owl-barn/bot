import { ParentCommand } from "../../../types/Command";
import { CommandGroup } from "../../../types/commandGroup";

module.exports = class extends ParentCommand {
  constructor() {
    super({
      name: "levelconfig",
      description: "Configure the level system settings",
      group: CommandGroup.config,
    });
  }
};
