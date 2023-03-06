import { ParentCommand } from "../../../types/Command";
import { CommandGroup } from "../../../types/commandGroup";

module.exports = class extends ParentCommand {
  constructor() {
    super({
      name: "friend",
      description: "Vc notifying system.",
      group: CommandGroup.general,
    });
  }
};
