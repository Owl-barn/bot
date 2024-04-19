import { state } from "@app";
import { Event } from "@structs/event";
import { localState } from "..";
import { updateCollection } from "../lib/selfrole";
import { SelfroleCollection } from "@prisma/client";
import { warningEmbedTemplate } from "@lib/embedTemplate";
import { logType } from "@lib/services/logService";

export default Event({
  name: "roleDelete",
  once: false,

  async execute(role) {

    const selfroles = await state.db.selfrole.findMany({
      where: { roleId: role.id },
      include: { collection: { include: { roles: true } } },
    });

    if (selfroles.length === 0) return;

    const changes: { collection: SelfroleCollection, success: boolean }[] = [];

    // Loop through the selfroles and update message.
    for (const selfrole of selfroles) {
      selfrole.collection.roles = selfrole.collection.roles.filter((r) => r.roleId !== role.id);

      let success = true;
      try {
        await updateCollection(selfrole.collection, false);

      } catch (error) {
        success = false;
        localState.log.warning("Failed to update collection after role deletion", error);
      }

      changes.push({ collection: selfrole.collection, success });
    }


    // Delete all selfroles that have the role from db
    const deleted = await state.db.selfrole.deleteMany({ where: { roleId: role.id } });

    localState.log.info(`Role deleted, ${selfroles.length} entries deleted for role '${role.name.green}' in ${role.guild.name} (${role.guild.id.cyan})`, { selfroles });

    // Log to guild logs
    const embed = warningEmbedTemplate();
    embed.setTitle("Role Deleted");

    if (changes.length > 1) {
      let description = `Updated ${deleted.count} selfrole collections for role \`${role.name}\`\n`;
      description += changes.map((change) =>
        `- ${change.success ? "✅" : "❌"} ${change.collection.title}`
      ).join("\n");

      embed.setDescription(description);

    } else {
      embed.setDescription(`${changes[0].success ? "updated" : "failed to update"} \`${changes[0].collection.title}\` selfrole collection for role \`${role.name}\``);
    }

    state.botLog.push(embed, role.guild.id, logType.BOT);
  },
});
