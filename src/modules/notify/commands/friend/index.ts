import { ParentCommand } from "@structs/command/parent";
import { CommandGroup } from "@structs/command";

export default ParentCommand({
  name: "friend",
  description: "Vc notifying system.",
  group: CommandGroup.general,
});

