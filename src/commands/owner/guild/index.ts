import { ParentCommand } from "../../../types/ParentCommand";

module.exports = class extends ParentCommand {
    constructor() {
        super({
            name: "guild",
            description: "Manage guilds",
        });
    }
};
