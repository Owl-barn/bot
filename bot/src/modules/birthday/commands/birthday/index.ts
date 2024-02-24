import { ParentCommand } from "@structs/command/parent";
import { CommandGroup } from "@structs/command";

export default ParentCommand({
  name: "birthday",
  description: "birthday",
  group: CommandGroup.general,
});
