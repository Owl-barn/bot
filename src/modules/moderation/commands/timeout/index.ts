import { CommandGroup } from "@structs/command";
import { ParentCommand } from "@structs/command/parent";

export default ParentCommand({
  name: "timeout",
  description: "Puts a user in or out of timeout.",
  group: CommandGroup.moderation,
});
