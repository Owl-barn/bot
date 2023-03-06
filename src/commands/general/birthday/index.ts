import { ParentCommand } from "../../../types/Command";
import { CommandGroup } from "../../../types/commandGroup";

module.exports = class extends ParentCommand {
  constructor() {
    super({
      name: "birthday",
      description: "birthday",
      group: CommandGroup.general,
    });
  }
};
