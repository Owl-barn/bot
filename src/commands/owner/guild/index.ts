import { ParentCommand } from "../../../types/Command";
import { CommandGroup } from "../../../types/commandGroup";

module.exports = class extends ParentCommand {
  constructor() {
    super({
      name: "guild",
      description: "Manage guilds",
      group: CommandGroup.owner,
    });
  }
};
