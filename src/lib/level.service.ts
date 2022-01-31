import { guilds } from "@prisma/client";
import { GuildTextBasedChannel, Message, RoleResolvable } from "discord.js";
import prisma from "./db.service";

const json = import("./levels.json");

class LevelService {
    private levelArray: LevelArray[];
    private db = prisma;
    private timeout: Map<string, number> = new Map();
    private guilds: Map<string, GuildConfig> = new Map();
    private maxLevel = 100;

    constructor() {
        this.levelArray = this.makeLevelArray(this.maxLevel);
        console.log(this.levelArray);
        this.sync().then(() => console.log("Loaded level guilds"));

        // this.load().then(() => console.log("Loaded levels"));
    }

    private load = async () => {
        const output = [];
        const input = await json;
        for (const x of input.default) {
            output.push({
                user_id: x.id,
                guild_id: "467011741738336258",
                experience: x.xp,
            });
        }

        await this.db.level.createMany({ data: output });
    }

    public message = async (msg: Message): Promise<void> => {
        if (!msg.guildId) return;
        const guildConfig = this.guilds.get(msg.guildId);
        if (!guildConfig) return;

        const id = `${msg.guildId}-${msg.author.id}`;
        const lastTimeout = this.timeout.get(id);

        if (lastTimeout && Date.now() - (60 * 1000) < lastTimeout) return;

        const guild = msg.guildId;
        const user = msg.author.id;

        let query = await this.db.level.findUnique({ where: { user_id_guild_id: { guild_id: guild, user_id: user } } });
        if (!query) query = await this.db.level.create({ data: { user_id: user, guild_id: guild } });

        const current = this.calculateLevel(query.experience);

        const toAdd = this.getRandomXP(guildConfig.modifier);
        current.currentXP += toAdd;

        if (current.currentXP >= this.levelArray[current.level].xp) {
            current.level += 1;

            // Assign level roles.
            const roleRewards = await this.db.level_reward.findMany({ where: { guild_id: guild, level: { lte: current.level } } });

            if (roleRewards.length > 0) {
                const roles: RoleResolvable[] = [];
                for (const x of roleRewards) {
                    const role = msg.guild?.roles.resolveId(x.role_id);
                    if (!role) continue;
                    roles.push(role);
                }
                await msg.member?.roles.add(roles);
            }

            // Notify user.
            if (guildConfig.message) {
                let message = guildConfig.message;
                message = message.replace("{LEVEL}", String(current.level));
                message = message.replace("{USER}", `<@${user}>`);
                message = message.replace("{NEW_ROLES}", String(roleRewards.length));

                if (guildConfig.channel) {
                    const channel = msg.guild?.channels.cache.get(guildConfig.channel) as GuildTextBasedChannel;
                    if (!channel) {
                        await this.db.guilds.update({ where: { guild_id: guild }, data: { level_channel: null } });
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
    }

    private getRandomXP = (modifier = 1.0) => Math.floor(modifier * (Math.random() * (25 - 15) + 15));

    // The xp required to reach the next level from the current level.
    private calculateLevelXP = (lvl: number) => 5 * (lvl * lvl) + (50 * lvl) + 100;

    // Make an array of levels and their xp values.
    private makeLevelArray = (maxLevel: number) => {
        const array: LevelArray[] = [];
        let total = 0;
        for (let i = 0; i < maxLevel + 1; i++) {
            const xp = this.calculateLevelXP(i);
            // total is the xp from 0, xp is to the next level.
            array.push({ total, xp, level: i });
            total += xp;
        }
        return array;
    }

    // Calculate level from total xp.
    public calculateLevel = (exp: number) => {
        let currentLevel;
        for (let index = 0; index < this.levelArray.length; index++) {
            if (this.levelArray[index].total < exp) continue;
            currentLevel = index === 0 ? 0 : index - 1;
            break;
        }

        if (!currentLevel && currentLevel !== 0) throw "a";

        const current = this.levelArray[currentLevel];

        return {
            totalXP: exp,
            level: current.level,
            levelXP: current.xp,
            currentXP: exp - current.total,
        };
    }

    public sync = async () => {
        const guildQuery = await this.db.guilds.findMany({ where: { level: true } });
        this.guilds = new Map();
        for (const guild of guildQuery) this.toggleGuild(guild);
    }

    public toggleGuild = async (guild: guilds) => {
        this.guilds.set(guild.guild_id, {
            channel: guild.level_channel,
            message: guild.level_message,
            modifier: guild.level_modifier,
        });
    }

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


interface GuildConfig {
    modifier: number;
    channel: string | null;
    message: string | null;
}

interface LevelArray {
    level: number;
    total: number;
    xp: number;
}

declare const global: NodeJS.Global & { levelService: LevelService };

const levelService = global.levelService || new LevelService();

if (process.env.NODE_ENV === "development") global.levelService = levelService;


export default levelService;