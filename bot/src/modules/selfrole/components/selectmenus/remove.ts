import { ComponentType } from "discord.js";
import { SelectMenu } from "@structs/selectMenu";
import { removeRole } from "@modules/selfrole/lib/remove";

export default SelectMenu(
  {
    name: "role_rm",
    type: ComponentType.StringSelect,
    isGlobal: false,
  },
  async (msg) => {
    const error = { ephemeral: true, content: "An error occured" };
    const user = msg.member;

    const roleId = msg.values[0].trim();

    if (!user) return error;
    const result = await removeRole(msg, roleId);
    return result;
  },
);
