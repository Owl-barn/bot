import { Command, SubCommand } from "../types/Command";
import env from "./env";

class ThrottleService {
    private list: Record<string, Record<string, ThrottleCommandMap[]>> = {};

    public isThrottled(
        guild: string,
        user: string,
        command: Command | SubCommand,
    ): number | boolean {
        const listUser = this.list[guild]?.[user];
        if (!listUser) return false;

        const now = Math.round(Date.now() / 1000);

        let total = 0;
        let oldest = Infinity;

        this.list[guild][user] = listUser.filter((item) => {
            if (item.name !== command.name) return true;

            if (now > item.date + command.throttling.duration) return false;

            total++;
            if (item.date < oldest) oldest = item.date;

            return true;
        });

        if (total >= command.throttling.usages)
            return command.throttling.duration - (now - oldest);

        return false;
    }

    public addToThrottle(guild: string, user: string, command: string): void {
        if (!this.list[guild]?.[user]) this.addUser(guild, user);

        this.list[guild][user].push({
            name: command,
            date: Math.round(Date.now() / 1000),
        });
    }

    private addUser(guild: string, user: string): void {
        if (!this.list[guild]) this.list[guild] = {};
        if (!this.list[guild][user]) this.list[guild][user] = [];
    }

    public cleanUp() {
        this.list = {};
    }
}

interface ThrottleCommandMap {
    name: string;
    date: number;
}

declare const global: NodeJS.Global & { throttleService: ThrottleService };

const throttleService = global.throttleService || new ThrottleService();

if (env.isDevelopment) global.throttleService = throttleService;

export default throttleService;