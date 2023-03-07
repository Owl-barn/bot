import { state } from "@src/app";
import { Event } from "@src/structs/event";
import { GuildMember, RoleResolvable } from "discord.js";
import bannedUsers from "../lib/banlist.service";
import { successEmbedTemplate } from "../lib/embedTemplate";
import { getAvatar } from "../lib/functions";
import GuildConfig from "../lib/guildconfig.service";
import levelService from "../lib/level.service";
import logService, { logType } from "../modules/logger.service";

export default {
  name: "guildMemberAdd",
  once: false,

  async execute(member: GuildMember): Promise<void> {
    const config = GuildConfig.getGuild(member.guild.id);
    if (config?.banned) return;
    if (bannedUsers.isBanned(member.id)) return;

    if (config?.log_join_leave) logJoin(member);
    if (config?.levelEnabled) addLevelRoles(member);

    if (
      member.id == state.env.OWNER_ID &&
      member.guild.id == "396330910162616321"
    ) {
      await member.roles.add([
        "439014722998763530",
        "699076784016195694",
        "908142029698134048",
      ]);
    }
  },

} as Event;

async function addLevelRoles(member: GuildMember) {
  const userLevel = await state.db.level.findUnique({
    where: {
      user_id_guild_id: {
        user_id: member.id,
        guild_id: member.guild.id,
      },
    },
  });

  if (!userLevel) return;

  const level = levelService.calculateLevel(userLevel.experience);
  const rewards = await state.db.level_reward.findMany({
    where: { level: { lte: level.level }, guild_id: member.guild.id },
  });

  if (rewards.length === 0) return;

  const roles: RoleResolvable[] = [];
  for (const x of rewards) {
    const role = member.guild.roles.resolveId(x.role_id);
    if (!role) continue;
    roles.push(role);
  }

  await member.roles
    .add(roles, "Level roles")
    .catch(() => console.log("Couldnt assign roles"));
}

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

  logService.log(embed, member.guild.id, logType.JOIN_LEAVE);
}
