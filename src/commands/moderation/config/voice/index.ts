import { SubCommandGroup } from "../../../../types/Command";

module.exports = class extends SubCommandGroup {
    constructor() {
        super({
            name: "voice",
            description: "Configure the private rooms.",
        });
    }
};
