import { CommandInfo } from "@structs/command/command";
import { SubCommandInfo } from "@structs/command/subcommand";

export class ThrottleService {
  private list: Record<string, Record<string, ThrottleCommandMap[]>> = {};

  public isThrottled(
    guild: string,
    user: string,
    command: CommandInfo<"processed"> | SubCommandInfo<"processed">,
  ): number | boolean {
    const throttleConfig = command.throttling;
    if (!throttleConfig) return false;
    const listUser = this.list[guild]?.[user];
    if (!listUser) return false;

    const now = Math.round(Date.now() / 1000);

    let total = 0;
    let oldest = Infinity;

    this.list[guild][user] = listUser.filter((item) => {
      if (item.name !== command.name) return true;

      if (now > item.date + throttleConfig.duration) return false;

      total++;
      if (item.date < oldest) oldest = item.date;

      return true;
    });

    if (total >= throttleConfig.usages)
      return throttleConfig.duration - (now - oldest);

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
