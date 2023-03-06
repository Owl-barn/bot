import { SubCommandGroup } from "../../../../types/Command";

module.exports = class extends SubCommandGroup {
  constructor() {
    super({
      name: "collection",
      description: "Manage the self role collections.",
    });
  }
};
