import bot from "../app";

export default async function getStatus(): Promise<{}> {
    const client = bot.getClient();

    if (!client) return { error: "No client" };
    
    const id = client.user?.id;

    if (!id)
        return {
            error: "Bot is not ready",
        };

    const guilds: Guild[] = [];

    for (const guild of client.guilds.cache.values()) {
        const item: Guild = { id: guild.id };
        const channelId = guild.me?.voice.channelId;
        channelId ? (item.channelId = channelId) : null;
        guilds.push(item);
    }

    const status: Status = {
        id,
        uptime: process.uptime(),
        guilds,
    };

    return { ...status };
}

interface Status {
    id: string;
    uptime: number;
    guilds: Guild[];
}

interface Guild {
    id: string;
    channelId?: string;
}
