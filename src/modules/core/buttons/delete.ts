import { Button } from "@structs/button";
import { localState } from "..";


export default Button(

  {
    name: "delete",
    isGlobal: true,
  },

  async (msg) => {
    const user = msg.customId.trim();

    if (msg.user.id !== user) return {};

    const deleted = await msg.message
      .delete()
      .catch(e => localState.log.error(`Error deleting message: `, { error: e }));

    if (deleted === null) await msg.update({ components: [] });

    return {};
  }

);
