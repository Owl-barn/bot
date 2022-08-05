import { GuildTextBasedChannel, Message, RoleResolvable } from "discord.js";
import env from "../modules/env";
import prisma from "./db.service";
import GuildConfig from "./guildconfig.service";

class LevelService {
    private levelArray: LevelArray[];
    private db = prisma;
    private timeout: Map<string, number> = new Map();
    private maxLevel = 10000;

    constructor() {
        this.levelArray = this.makeLevelArray(this.maxLevel);
    }

    public clearThrottle = (): void => {
        this.timeout = new Map();
    };

    public message = async (msg: Message): Promise<void> => {
        if (!msg.guildId) return;
        const guildConfig = GuildConfig.getGuild(msg.guildId);
        if (!guildConfig) return;
        if (!guildConfig.levelEnabled) return;

        const id = `${msg.guildId}-${msg.author.id}`;
        const lastTimeout = this.timeout.get(id);

        if (lastTimeout && Date.now() - 60 * 1000 < lastTimeout) return;

        const guild = msg.guildId;
        const user = msg.author.id;

        let query = await this.db.level.findUnique({
            where: { user_id_guild_id: { guild_id: guild, user_id: user } },
        });
        if (!query)
            query = await this.db.level.create({
                data: { user_id: user, guild_id: guild },
            });

        const current = this.calculateLevel(query.experience);

        const toAdd = this.getRandomXP(guildConfig.levelModifier);
        current.currentXP += toAdd;

        if (current.currentXP >= this.levelArray[current.level].xp) {
            current.level += 1;

            // Assign level roles.
            const roleRewards = await this.db.level_reward.findMany({
                where: { guild_id: guild, level: { lte: current.level } },
            });

            const currentRoles = msg.member?.roles.cache.map((x) => x.id);

            const rolesToAdd = currentRoles
                ? roleRewards.filter(
                      (x) => currentRoles?.indexOf(x.role_id) === -1,
                  )
                : roleRewards;

            if (rolesToAdd.length > 0) {
                const roles: RoleResolvable[] = [];
                for (const x of rolesToAdd) {
                    const role = msg.guild?.roles.resolveId(x.role_id);
                    if (!role) continue;
                    roles.push(role);
                }
                await msg.member?.roles.add(roles);
            }

            // Notify user.
            if (guildConfig.levelMessage) {
                let message = guildConfig.levelMessage;
                message = message.replace("{LEVEL}", String(current.level));
                message = message.replace("{USER}", `<@${user}>`);
                message = message.replace(
                    "{NEW_ROLES}",
                    String(rolesToAdd.length),
                );

                if (guildConfig.levelChannel) {
                    const channel = msg.guild?.channels.cache.get(
                        guildConfig.levelChannel,
                    ) as GuildTextBasedChannel;
                    if (!channel) {
                        await this.db.guilds.update({
                            where: { guild_id: guild },
                            data: { level_channel: null },
                        });
                        msg.reply(message);
                    } else channel.send(message);
                } else {
                    msg.reply(message);
                }
            }
        }

        await this.db.level.update({
            where: { user_id_guild_id: { guild_id: guild, user_id: user } },
            data: { experience: current.totalXP + toAdd },
        });

        this.timeout.set(id, Date.now());
    };

    private getRandomXP = (modifier = 1.0) =>
        Math.floor(modifier * (Math.random() * (25 - 15) + 15));

    // The xp required to reach the next level from the current level.
    private calculateLevelXP = (lvl: number) =>
        5 * (lvl * lvl) + 50 * lvl + 100;

    // Make an array of levels and their xp values.
    private makeLevelArray = (maxLevel: number) => {
        const now = Date.now();
        const array: LevelArray[] = [];
        let total = 0;
        for (let i = 0; i < maxLevel + 1; i++) {
            const xp = this.calculateLevelXP(i);
            // total is the xp from 0, xp is to the next level.
            array.push({ total, xp, level: i });
            total += xp;
        }
        console.log(
            " ✓ Loaded level array in ".green.bold +
                `${Date.now() - now}ms.`.cyan,
        );
        return array;
    };

    // Calculate level from total xp.
    public calculateLevel = (exp: number) => {
        let currentLevel;
        for (let index = 0; index < this.levelArray.length; index++) {
            if (this.levelArray[index].total < exp) continue;
            currentLevel = index === 0 ? 0 : index - 1;
            break;
        }

        if (!currentLevel && currentLevel !== 0)
            throw "Couldn't calculate level.";

        const current = this.levelArray[currentLevel];

        return {
            totalXP: exp,
            level: current.level,
            levelXP: current.xp,
            currentXP: exp - current.total,
        };
    };

    /*
    private levelFromXP = (xp: number, maxLevel = 100): number => {
        const XPLevelArr = this.makeLevelArray(maxLevel);
        for (let i = 0; i < XPLevelArr.length; i++) {
            if (xp > XPLevelArr[i].xp) return i + 1;
        }
        return this.levelFromXP(xp, XPLevelArr.length * 2);
    }
    */
}

interface LevelArray {
    level: number;
    total: number;
    xp: number;
}

declare const global: NodeJS.Global & { levelService: LevelService };

const levelService = global.levelService || new LevelService();

if (env.isDevelopment) global.levelService = levelService;

export default levelService;
