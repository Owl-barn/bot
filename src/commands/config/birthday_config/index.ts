import { ParentCommand } from "../../../types/Command";
import { CommandGroup } from "../../../types/commandGroup";

module.exports = class extends ParentCommand {
  constructor() {
    super({
      name: "birthdayconfig",
      description: "Manage the birthdays in this server!",
      group: CommandGroup.config,
    });
  }
};
