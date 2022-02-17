import { Prisma } from "@prisma/client";
import prisma from "../lib/db.service";
import RavenInteraction from "../types/interaction";

class logServiceClass {
    private timeout: Record<string, NodeJS.Timeout>;
    private logCache: Record<string, string[]>
    private logConfig: Record<string, string>

    private executeQueries = async (guild: string) => {
        clearTimeout(this.timeout[guild]);
    }

    private pushlog = (content: string, guild: string) => {
        this.logCache[guild].push(content);
        if (this.logCache[guild].length > 10) {
            clearTimeout(this.timeout[guild]);
            this.executeQueries(guild);
        } else {
            this.timeout[guild] = setTimeout(() => this.executeQueries(guild), 180000);
        }
    }

    public logCommand = (interaction: RavenInteraction, hidden: boolean): void => {
        const subCommand = interaction.options.getSubcommand(false);
        const commandName = subCommand ? `${interaction.commandName}_${subCommand}` : interaction.commandName;

        const query: Prisma.command_logUncheckedCreateInput = {
            user: interaction.user.id,
            command_name: commandName,
            guild_id: interaction.guildId || "000000000000000000",
            channel_id: interaction.channelId,
            hidden,
        };

        prisma.command_log.create({ data: query }).then(() => console.info(`${interaction.guild?.name}: ${interaction.user.username}: ${commandName}: ${hidden}`));
    }
}

declare const global: NodeJS.Global & { logService: logServiceClass };
const logService: logServiceClass = global.logService || new logServiceClass();
if (process.env.NODE_ENV === "development") global.logService = logService;


export default logService;