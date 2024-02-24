import { CommandGroup } from "@structs/command";
import { ParentCommand } from "@structs/command/parent";

export default ParentCommand({
  name: "levelconfig",
  description: "Configure the level system settings",
  group: CommandGroup.config,
});
