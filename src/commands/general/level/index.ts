import { ParentCommand } from "../../../types/Command";
import { CommandGroup } from "../../../types/commandGroup";

module.exports = class extends ParentCommand {
  constructor() {
    super({
      name: "level",
      description: "Levelling system.",
      group: CommandGroup.general,
    });
  }
};
