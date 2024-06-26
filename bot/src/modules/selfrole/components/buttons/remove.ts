import { Button } from "@structs/button";
import { removeRole } from "@modules/selfrole/lib/remove";

export default Button(

  {
    name: "role_rm",
    isGlobal: false,
  },

  async (msg) => {
    const error = { ephemeral: true, content: "An error occured" };
    const user = msg.member;

    const roleId = msg.customId.trim();

    if (!user) return error;
    const result = await removeRole(msg, roleId);
    return result;
  }

);

