import { ParentCommand } from "../../../../types/ParentCommand";

module.exports = class extends ParentCommand {
    constructor() {
        super({
            name: "voice",
            description: "Configure the private rooms.",
        });
    }
};
