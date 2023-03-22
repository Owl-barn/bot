import { Button } from "@structs/button";


export default {
  name: "delete",

  async run(msg) {
    const user = msg.customId.trim();

    if (msg.user.id !== user) return {};

    const deleted = await msg.message.delete().catch(() => null);

    if (deleted === null) await msg.update({ components: [] });

    return {};
  },

} as Button;
