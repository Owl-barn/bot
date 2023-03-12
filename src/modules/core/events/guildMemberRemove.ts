import { failEmbedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { logType } from "@lib/services/logService";
import { state } from "@app";
import { Event } from "@structs/event";
import { GuildMember, PartialGuildMember } from "discord.js";

export default Event({
  name: "guildMemberRemove",
  once: false,

  async execute(member) {
    if (!member.guild.id) return;
    const config = state.guilds.get(member.guild.id);

    if (config?.isBanned) return;
    if (config?.logJoinLeave) logLeave(member);
  },

});

async function logLeave(member: GuildMember | PartialGuildMember) {
  const embed = failEmbedTemplate();
  const isBot = member.user.bot ? "**Bot:** 🤖" : "";
  const createdAt = Math.round(Number(member.user.createdAt) / 1000);

  embed.setTitle("Member Left");
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
