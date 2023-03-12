import { CommandGroup } from "@structs/command";
import { ParentCommand } from "@structs/command/parent";

export default ParentCommand({
  name: "log_config",
  description: "Configure event logging.",
  group: CommandGroup.config,
});
