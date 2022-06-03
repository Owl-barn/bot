import { ParentCommand } from "../../../types/Command";
import { CommandGroup } from "../../../types/commandGroup";

module.exports = class extends ParentCommand {
    constructor() {
        super({
            name: "privateroom",
            description: "Manage your private room.",
            group: CommandGroup.general,
        });
    }
};
