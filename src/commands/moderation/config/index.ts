import { ParentCommand } from "../../../types/ParentCommand";

module.exports = class extends ParentCommand {
    constructor() {
        super({
            name: "config",
            description: "Configure the bot in this server!",
        });
    }
};
