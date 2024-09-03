import { CommandGroup } from "@structs/command";
import { contextEverywhere } from "@structs/command/context";
import { ParentCommand } from "@structs/command/parent";

export default ParentCommand({
  name: "reminder",
  description: "Reminder system",
  group: CommandGroup.general,

  context: contextEverywhere,
});
