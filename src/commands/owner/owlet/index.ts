import { CommandGroup } from "../../../types/commandGroup";
import { ParentCommand } from "../../../types/ParentCommand";

module.exports = class extends ParentCommand {
    constructor() {
        super({
            name: "owlet",
            description: "Manage the owlets.",
            group: CommandGroup.owner,
        });
    }
};
