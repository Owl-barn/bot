import { failEmbedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { logType } from "@lib/services/logService";
import { state } from "@app";
import { Event } from "@structs/event";

export default Event({
  name: "messageDelete",
  once: false,
  ignoreBans: true,

  async execute(msg) {
    if (!msg.guildId) return;
    if (msg.member?.user.bot) return;
    if (msg.content == "") return;
    const config = state.guilds.get(msg.guildId);
    if (!config || !config.logEvents || config.isBanned) return;

    const embed = failEmbedTemplate();

    embed.setTitle("Message Deleted");
    embed.setDescription(`<#${msg.channelId}>\n` + `\`\`\`${msg.content}\`\`\``);

    const member = msg.member;
    if (member) {
      const avatar = getAvatar(member);

      embed.setFooter({
        text: `${member.user.tag} <@${member.id}>`,
        iconURL: avatar,
      });
    }

    state.log.push(embed, msg.guildId, logType.EVENT);
  },

});
