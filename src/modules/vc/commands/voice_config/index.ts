import { ParentCommand } from "@structs/command/parent";
import { CommandGroup } from "@structs/command";

export default ParentCommand({
  name: "voiceconfig",
  description: "Configure the private rooms.",
  group: CommandGroup.config,
});

