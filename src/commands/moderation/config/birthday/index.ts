import { SubCommandGroup } from "../../../../types/Command";

module.exports = class extends SubCommandGroup {
    constructor() {
        super({
            name: "birthday",
            description: "Manage the birthdays in this server!",
        });
    }
};
