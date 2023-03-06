import { SubCommandGroup } from "../../../../types/Command";

module.exports = class extends SubCommandGroup {
  constructor() {
    super({
      name: "unbannotice",
      description: "Set or remove the unban notice.",
    });
  }
};
