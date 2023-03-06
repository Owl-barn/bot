import { SubCommandGroup } from "../../../../types/Command";

module.exports = class extends SubCommandGroup {
  constructor() {
    super({
      name: "rewards",
      description: "Configure the level and rewards.",
    });
  }
};
