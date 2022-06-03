import { ParentCommand } from "../../../../types/ParentCommand";

module.exports = class extends ParentCommand {
    constructor() {
        super({
            name: "level",
            description: "Configure the level system.",
        });
    }
};
