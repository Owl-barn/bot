import { CommandGroup } from "@structs/command";
import { ParentCommand } from "@structs/command/parent";

export default ParentCommand({
  name: "infractions",
  description: "View the moderation actions that have been taken.",
  group: CommandGroup.moderation,
});
