import { CommandGroup } from "@structs/command";
import { ParentCommand } from "@structs/command/parent";

export default ParentCommand({
  name: "reminder",
  description: "Reminder system",
  group: CommandGroup.general,
});
