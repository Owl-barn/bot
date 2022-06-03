import { ParentCommand } from "../../../../types/ParentCommand";

module.exports = class extends ParentCommand {
    constructor() {
        super({
            name: "birthday",
            description: "Manage the birthdays in this server!",
        });
    }
};
