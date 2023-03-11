import { ParentCommand } from "@structs/command/parent";
import { CommandGroup } from "@structs/command";

export default ParentCommand({
  name: "selfrole",
  description: "Manage the self-assignable roles",
  group: CommandGroup.management,
});
