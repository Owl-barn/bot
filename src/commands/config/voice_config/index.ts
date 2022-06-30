import { ParentCommand } from "../../../types/Command";
import { CommandGroup } from "../../../types/commandGroup";

module.exports = class extends ParentCommand {
    constructor() {
        super({
            name: "voiceconfig",
            description: "Configure the private rooms.",
            group: CommandGroup.config,
        });
    }
};
