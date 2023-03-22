import { CommandGroup } from "@structs/command";
import { ParentCommand } from "@structs/command/parent";

export default ParentCommand({
  name: "owlet",
  description: "Manage the owlets.",
  group: CommandGroup.owner,
});
