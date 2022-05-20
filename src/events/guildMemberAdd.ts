import { GuildMember, RoleResolvable } from "discord.js";
import GuildConfig from "../lib/guildconfig.service";
import levelService from "../lib/level.service";
import RavenEvent from "../types/event";
import RavenClient from "../types/ravenClient";

export default class implements RavenEvent {
    name = "guildMemberAdd";
    once = false;

    async execute(member: GuildMember): Promise<void> {
        const client = member.client as RavenClient;
        if (GuildConfig.getGuild(member.guild.id)?.banned) return;

        const userLevel = await client.db.level.findUnique({
            where: {
                user_id_guild_id: {
                    user_id: member.id,
                    guild_id: member.guild.id,
                },
            },
        });

        if (!userLevel) return;

        const level = levelService.calculateLevel(userLevel.experience);
        const rewards = await client.db.level_reward.findMany({
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
}
