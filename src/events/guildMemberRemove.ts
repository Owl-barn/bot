import { rcon } from "@prisma/client";
import { GuildMember } from "discord.js";
import { failEmbedTemplate } from "../lib/embedTemplate";
import { getAvatar } from "../lib/functions";
import GuildConfig from "../lib/guildconfig.service";
import { getMcName, RCONHandler } from "../lib/mc.service";
import logService, { logType } from "../modules/logger.service";
import RavenEvent from "../types/event";
import RavenClient from "../types/ravenClient";

export default class implements RavenEvent {
  name = "guildMemberRemove";
  once = false;

  async execute(member: GuildMember): Promise<void> {
    if (!member.guild.id) return;
    const config = GuildConfig.getGuild(member.guild.id);

    if (config?.banned) return;
    if (config?.log_join_leave) logLeave(member);
    if (config?.rcon) await whitelistLeave(member, config.rcon);
  }
}

async function logLeave(member: GuildMember) {
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

  logService.log(embed, member.guild.id, logType.JOIN_LEAVE);
}

async function whitelistLeave(member: GuildMember, config: rcon) {
  const whitelist = await (member.client as RavenClient).db.whitelist
    .delete({
      where: {
        whitelist_guild_user_un: {
          guild_id: member.guild.id,
          user_id: member.id,
        },
      },
    })
    .catch(() => null);

  console.log({ whitelist });

  if (!whitelist) return;
  const mcName = await getMcName(whitelist.mc_uuid);

  console.log({ mcName });

  if (!mcName) return;
  const result = await RCONHandler(
    [`whitelist remove ${mcName}`],
    config,
  ).catch(() => null);

  console.log({ result });
  if (!result) console.log(`Failed to remove ${member.id} from whitelist`);
  else console.log(`Removed ${member.id} from whitelist`);
}
