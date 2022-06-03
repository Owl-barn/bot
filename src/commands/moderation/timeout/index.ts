import { ParentCommand } from "../../../types/Command";
import { CommandGroup } from "../../../types/commandGroup";

module.exports = class extends ParentCommand {
    constructor() {
        super({
            name: "timeout",
            description: "Puts a user in or out of timeout.",
            group: CommandGroup.moderation,
        });
    }
};
