import { SubCommandGroup } from "../../../../types/Command";

module.exports = class extends SubCommandGroup {
    constructor() {
        super({
            name: "logging",
            description: "Configure event logging.",
        });
    }
};
