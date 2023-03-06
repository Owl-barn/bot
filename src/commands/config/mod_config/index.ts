import { ParentCommand } from "../../../types/Command";
import { CommandGroup } from "../../../types/commandGroup";

module.exports = class extends ParentCommand {
  constructor() {
    super({
      name: "modconfig",
      description: "Configure the moderation settings",
      group: CommandGroup.config,
    });
  }
};
