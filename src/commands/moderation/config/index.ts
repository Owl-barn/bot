import { ParentCommand } from "../../../types/Command";
import { CommandGroup } from "../../../types/commandGroup";

module.exports = class extends ParentCommand {
    constructor() {
        super({
            name: "config",
            description: "Configure the bot in this server!",
            group: CommandGroup.moderation,
        });
    }
};
