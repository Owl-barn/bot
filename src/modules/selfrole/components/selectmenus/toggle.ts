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
    const result = await toggleRole(user, roleId);
    // update the select menu with an exact copy of itself, to remove the user's selection (i hate this being a thing)
    await msg.update({ components: msg.message.components });
    return result;
  },
);
