import { CommandGroup } from "@structs/command";
import { ParentCommand } from "@structs/command/parent";

export default ParentCommand({
  name: "level",
  description: "Levelling system.",
  group: CommandGroup.general,
});
