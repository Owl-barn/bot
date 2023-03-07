import { ParentCommand } from "@structs/command/parent";
import { CommandGroup } from "@structs/command";

export default ParentCommand({
  name: "birthdayconfig",
  description: "Manage the birthdays in this server!",
  group: CommandGroup.config,
});
