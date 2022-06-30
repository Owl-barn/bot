import { SubCommandGroup } from "../../../../types/Command";

module.exports = class extends SubCommandGroup {
    constructor() {
        super({
            name: "role",
            description: "Manage the self role collection roles.",
        });
    }
};
