import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";


export default SubCommand(

  // Info
  {
    name: "remove",
    description: "Removes the unban notice.",

    botPermissions: ["BanMembers"],

    throttling: {
      duration: 60,
      usages: 2,
    },
  },

  // Execute
  async (msg) => {


    state.db.guild.update({
      where: { id: msg.guildId },
      data: { unbanNotice: null },
    });


    const embed = embedTemplate();
    embed.setDescription(`The unban notice has successfully been removed.`);

    return { embeds: [embed] };
  }

);
