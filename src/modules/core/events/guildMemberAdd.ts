import { successEmbedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { logType } from "@lib/services/logService";
import { state } from "@app";
import { Event } from "@structs/event";
import { GuildMember } from "discord.js";


export default Event({
  name: "guildMemberAdd",
  once: false,

  async execute(member) {
    const config = state.guilds.get(member.guild.id);

    if (config?.logJoinLeave) logJoin(member);
  },

});

async function logJoin(member: GuildMember) {
  const embed = successEmbedTemplate();
  const isBot = member.user.bot ? "**Bot:** 🤖" : "";
  const createdAt = Math.round(Number(member.user.createdAt) / 1000);
  embed.setTitle("Member Joined");
  embed.setDescription(
    `**User:** <@${member.id}>\n` +
    `**Account creation:** <t:${createdAt}:R>\n` +
    isBot,
  );

  embed.setFooter({
    text: `${member.user.tag} <@${member.id}>`,
    iconURL: getAvatar(member),
  });

  state.log.push(embed, member.guild.id, logType.JOIN_LEAVE);
}
