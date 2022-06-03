import { SubCommandGroup } from "../../../../types/Command";

module.exports = class extends SubCommandGroup {
    constructor() {
        super({
            name: "level",
            description: "Configure the level system.",
        });
    }
};
