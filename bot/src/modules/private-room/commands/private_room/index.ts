import { ParentCommand } from "@structs/command/parent";
import { CommandGroup } from "@structs/command";

export default ParentCommand({
  name: "privateroom",
  description: "Manage your private room.",
  group: CommandGroup.general,
});

