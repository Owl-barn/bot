import { ParentCommand } from "../../../types/ParentCommand";

module.exports = class extends ParentCommand {
    constructor() {
        super({
            name: "private_room",
            description: "Manage your private room.",
        });
    }
};
