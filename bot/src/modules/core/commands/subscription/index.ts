import { CommandGroup } from "@structs/command";
import { ParentCommand } from "@structs/command/parent";

export default ParentCommand({
  name: "subscription",
  description: "View and configure your subscription.",
  group: CommandGroup.general,
});
