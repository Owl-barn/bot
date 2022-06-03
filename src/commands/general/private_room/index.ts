import { ParentCommand } from "../../../types/Command";
import { CommandGroup } from "../../../types/commandGroup";

module.exports = class extends ParentCommand {
    constructor() {
        super({
            name: "private_room",
            description: "Manage your private room.",
            group: CommandGroup.general,
        });
    }
};
