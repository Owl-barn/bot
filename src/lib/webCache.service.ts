import Collection from "@discordjs/collection";
import { GuildItem } from "../routes/guilds/guilds.controller";


class WebCache {
    private guilds: Collection<string, GuildItem[]>

    constructor() {
        this.guilds = new Collection();
    }

    public getGuilds = (user: string) => {
        return this.guilds.get(user);
    }

    public setGuilds = (user: string, guilds: GuildItem[]) => {
        this.guilds.set(user, guilds);
    }

}

declare const global: NodeJS.Global & { webCache?: WebCache };


const webCache: WebCache = global.webCache || new WebCache();

if (process.env.NODE_ENV === "development") global.webCache = webCache;

export default webCache;