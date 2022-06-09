import { ParentCommand } from "../../../types/Command";
import { CommandGroup } from "../../../types/commandGroup";

module.exports = class extends ParentCommand {
    constructor() {
        super({
            name: "infractions",
            description: "View the moderation actions that have been taken.",
            group: CommandGroup.moderation,
        });
    }
};
