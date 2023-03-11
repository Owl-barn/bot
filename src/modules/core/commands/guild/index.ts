import { ParentCommand } from "@structs/command/parent";
import { CommandGroup } from "@structs/command";

export default ParentCommand({
  name: "guild",
  description: "Manage guilds",
  group: CommandGroup.owner,
});
