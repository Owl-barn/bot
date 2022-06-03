import { ParentCommand } from "../../../types/Command";
import { CommandGroup } from "../../../types/commandGroup";

module.exports = class extends ParentCommand {
    constructor() {
        super({
            name: "owlet",
            description: "Manage the owlets.",
            group: CommandGroup.owner,
        });
    }
};
