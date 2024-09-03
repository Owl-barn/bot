import { ParentCommand } from "@structs/command/parent";
import { CommandGroup } from "@structs/command";
import { contextEverywhere } from "@structs/command/context";

export default ParentCommand({
  name: "birthday",
  description: "birthday",
  group: CommandGroup.general,

  context: contextEverywhere,
});
