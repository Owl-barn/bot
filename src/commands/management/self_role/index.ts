import { ParentCommand } from "../../../types/Command";
import { CommandGroup } from "../../../types/commandGroup";

module.exports = class extends ParentCommand {
    constructor() {
        super({
            name: "selfrole",
            description: "Manage the self-assignable roles",
            group: CommandGroup.management,
        });
    }
};
