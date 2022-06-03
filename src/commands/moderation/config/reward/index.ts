import { ParentCommand } from "../../../../types/ParentCommand";

module.exports = class extends ParentCommand {
    constructor() {
        super({
            name: "rewards",
            description: "Configure the level and rewards.",
        });
    }
};
