import { ParentCommand } from "@structs/command/parent";
import { CommandGroup } from "@structs/command";

export default ParentCommand({
  name: "subscriber",
  description: "Manage subscribers",
  group: CommandGroup.owner,
});
