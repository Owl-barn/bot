import { toggleRole } from "@modules/selfrole/lib/toggle";
import { Button } from "@structs/button";

export default Button(

  {
    name: "role_toggle",
    isGlobal: false,
  },

  async (msg) => {
    const error = { ephemeral: true, content: "An error occured" };
    const user = msg.member;

    const roleId = msg.customId.trim();

    if (!user) return error;
    return await toggleRole(user, roleId);
  }

);
