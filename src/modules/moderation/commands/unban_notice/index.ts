import { CommandGroup } from "@structs/command";
import { ParentCommand } from "@structs/command/parent";

export default ParentCommand({
  name: "unbannotice",
  description: "Set or remove the unban notice.",
  group: CommandGroup.config,
});

