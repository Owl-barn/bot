import { state } from "@app";
import { localState } from "..";
import { LevelArray } from "../structs/levelArray";
import { connectOrCreate } from "@lib/prisma/connectOrCreate";
import { ChannelType, Collection, GuildMember, Message, RoleResolvable, VoiceChannel } from "discord.js";
import { warningEmbedTemplate } from "@lib/embedTemplate";
import { logType } from "@lib/services/logService";
import { Guild, LevelReward } from "@prisma/client";
import { randomRange } from "@lib/functions";

export interface CalculatedLevel {
  totalXP: number;
  level: number;
  levelXP: number;
  currentXP: number;
}

type HandleXPEventConfig = {
  xp?: number;
  sendMessage?: boolean;
  timeout?: number;
};


export class LevelController {
  /**
   * Array of levels and XP required to reach them.
   */
  private levelArray: LevelArray[];

  /**
   * Map of userId-guildId as key and last XP grant time as value.
   */
  private lastXPgrant: Map<string, number> = new Map();
  public readonly expiryDuration = 10 * 60 * 1000;

  // Voice
  public static readonly voiceTimeoutMs = 5 * 60 * 1000;
  public static readonly voiceExperienceRange = [25, 40];
  public static readonly voiceAverageExperience = (this.voiceExperienceRange[0] + this.voiceExperienceRange[1]) / 2;
  public static voiceXP = () => randomRange(this.voiceExperienceRange[0], this.voiceExperienceRange[1]);

  // Message
  public static readonly messageTimeoutMs = 60 * 1000;
  public static readonly messageExperienceRange = [15, 25];
  public static readonly messageAverageExperience = (this.messageExperienceRange[0] + this.messageExperienceRange[1]) / 2;
  public static messageXP = () => randomRange(this.messageExperienceRange[0], this.messageExperienceRange[1]);

  constructor() {
    this.levelArray = LevelController.generateLevelArray(localState.maxLevel);
  }

  // Level-XP conversion functions
  public getLevelFromXP(xp: number) {
    let currentLevel;

    for (let index = 0; index < this.levelArray.length; index++) {
      if (xp >= this.levelArray[index].total) continue;
      currentLevel = index === 0 ? 0 : index - 1;
      break;
    }

    if (!currentLevel && currentLevel !== 0)
      throw "Couldn't calculate level.";

    const current = this.levelArray[currentLevel];

    return {
      totalXP: xp,
      level: current.level,
      levelXP: current.xp,
      currentXP: xp - current.total,
    };
  }

  public static getXPFromLevel(lvl: number) {
    return 5 * (lvl * lvl) + 50 * lvl + 100;
  }

  private static generateLevelArray(maxLevel: number) {
    const array: LevelArray[] = [];
    let total = 0;

    for (let i = 0; i < maxLevel + 1; i++) {
      const xp = LevelController.getXPFromLevel(i);
      // total is the xp from 0, xp is to the next level.
      array.push({ total, xp, level: i });
      total += xp;
    }

    return array;
  }

  public static async getLevelData(guildId: string, userId: string) {
    let levelData = await state.db.level.findUnique({
      where: {
        userId_guildId: { guildId, userId },
      },
    });

    if (!levelData)
      levelData = await state.db.level.create({
        data: {
          user: connectOrCreate(userId),
          guild: connectOrCreate(guildId),
        },
      });

    return levelData;
  }

  // Timeout functions
  public isUserTimedOut(member: GuildMember, timeout = LevelController.messageTimeoutMs) {
    const id = `${member.guild.id}-${member.id}`;
    const lastTimeout = this.lastXPgrant.get(id);

    if (lastTimeout && lastTimeout + timeout > Date.now()) return true;

    this.lastXPgrant.set(id, Date.now());

    return false;
  }

  public setUserTimeout(member: GuildMember) {
    const id = `${member.guild.id}-${member.id}`;
    this.lastXPgrant.set(id, Date.now());
  }

  public async clearExpiredTimeouts() {
    const now = Date.now();
    this.lastXPgrant.forEach((value, key) => {
      if (now - value > this.expiryDuration) this.lastXPgrant.delete(key);
    });
  }

  // XP functions
  public async changeUserXP(guildId: string, userId: string, { voiceXP, messageXP }: { voiceXP?: number, messageXP?: number }) {
    const oldData = await LevelController.getLevelData(guildId, userId);
    const newData = await state.db.level.update({
      where: { userId_guildId: { guildId: oldData.guildId, userId: oldData.userId } },
      data: { messageExperience: { increment: messageXP || 0 }, voiceExperience: { increment: voiceXP || 0 } },
    });

    const newLevel = this.getLevelFromXP(newData.messageExperience + newData.voiceExperience);
    const oldLevel = this.getLevelFromXP(oldData.messageExperience + oldData.voiceExperience);

    const levelDelta = newLevel.level - oldLevel.level;

    return { oldData, newData, oldLevel, newLevel, levelDelta };
  }

  public async vcLoop() {
    let guilds = state.client.guilds.cache;

    // Filter out guilds that don't have the level system and voice XP gain enabled.
    guilds = guilds.filter((x) => {
      const config = state.guilds.get(x.id);
      return config && config.levelSystemEnabled && config.levelVoiceXPGain;
    });

    for (const guild of guilds.values()) {
      const channels = guild.channels.cache.filter((x) => x.type === ChannelType.GuildVoice) as Collection<string, VoiceChannel>;

      for (const channel of channels.values()) {
        // Filter out bots and deafened users.
        const members = channel.members
          .filter(member => !member.user.bot)
          .filter(member => !member.voice.deaf);

        // filter out users that are alone.
        if (members.size <= 1) continue;

        for (const member of members.values()) {
          await this.handleXPEvent(member, null, { xp: LevelController.voiceXP(), timeout: LevelController.voiceTimeoutMs });
        }
      }
    }
  }

  public async handleXPEvent(member: GuildMember, message: Message<true> | null, config: HandleXPEventConfig = {}) {
    const guildConfig = state.guilds.get(member.guild.id);
    if (!guildConfig) return;
    if (!guildConfig?.levelSystemEnabled) return;
    if (message && !guildConfig.levelMessageXPGain) return;

    config.sendMessage = config.sendMessage === false ? false : true;

    if (this.isUserTimedOut(member, config.timeout)) return;

    const xp = (config.xp || LevelController.messageXP()) * guildConfig.levelModifier;

    const data = await this.changeUserXP(
      member.guild.id,
      member.id,
      message ? { messageXP: xp } : { voiceXP: xp }
    );

    this.setUserTimeout(member);

    // Check if the user leveled up.
    if (data.levelDelta === 0) return;

    const roles = await this.getRoles(member, data.newLevel);

    await Promise.allSettled([
      this.addLevelRoles(member, roles),
      config.sendMessage ? this.sendLevelUpMessage(member, message, guildConfig, data.newLevel, roles) : null,
    ]);
  }

  // Level change
  public async addLevelRoles(member: GuildMember, rolesToAdd: LevelReward[]) {
    if (rolesToAdd.length === 0) return;

    // Resolve the roles to add
    const roles = rolesToAdd.reduce((acc, x) => {
      const role = member.guild.roles.resolveId(x.roleId);
      if (role) acc.push(x.roleId);
      return acc;
    }, [] as RoleResolvable[]);

    // Add the roles to the user
    await member?.roles.add(roles);
  }

  public async sendLevelUpMessage(member: GuildMember, msg: Message<true> | null, config: Guild, current: CalculatedLevel, roles: LevelReward[]) {
    let message = config.levelMessage;
    if (!message) return;

    // Replace the placeholders with the actual values.
    message = message.replace("{USER}", `<@${member.id}>`);
    message = message.replace("{LEVEL}", String(current.level));
    message = message.replace("{XP}", String(current.levelXP));
    message = message.replace("{NEW_ROLES}", String(roles.length));

    if (config.levelChannelId) {
      const channel = await member.guild.channels.fetch(config.levelChannelId);

      // If the channel is not found or not text based, remove the channel from the database.
      if (!channel || !channel.isTextBased()) {
        await state.db.guild.update({
          where: { id: member.guild.id },
          data: { levelChannelId: null },
        });

        // Log the error
        state.botLog.push(
          warningEmbedTemplate("I could not find or access the level channel. so it has been reset."),
          member.guild.id,
          logType.BOT
        );

        if (msg) await msg.reply(message);
      } else {
        // If the channel is found, send the message.
        await channel.send(message);
      }

    } else if (msg) {
      // If the channel is not set, send the message to the user with a reply.
      msg.reply(message);
    } else if (member.voice.channel) {
      // If the user is in a voice channel, send the message to the voice channel.
      await member.voice.channel.send(message);
    } else {
      localState.log.warning(`Could not send level message to <@${member.user.tag}> in ${member.guild.name}`);
    }
  }


  // Util
  public async getRoles(member: GuildMember, current: CalculatedLevel) {
    // Fetch rewards from db
    const roleRewards = await state.db.levelReward.findMany({
      where: { guildId: member.guild.id, level: { lte: current.level } },
    });

    const currentRoles = member.roles.cache.map((x) => x.id);

    // Check what roles the user is missing
    const rolesToAdd = currentRoles
      ? roleRewards.filter((x) => currentRoles?.indexOf(x.roleId) === -1)
      : roleRewards;

    return rolesToAdd;
  }
}
