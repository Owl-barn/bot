import { ComponentType } from "discord.js";
import { SelectMenu } from "@structs/selectMenu";
import { toggleRole } from "@modules/selfrole/lib/toggle";

export default SelectMenu(
  {
    name: "role_toggle",
    type: ComponentType.StringSelect,
    isGlobal: false,
  },
  async (msg) => {
    const error = { ephemeral: true, content: "An error occured" };
    const user = msg.member;

    const roleId = msg.values[0].trim();

    if (!user) return error;
    return await toggleRole(user, roleId);
  },
);
