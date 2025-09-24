import Rcon from "rcon-srcds";
import { localState } from "..";
import { RconGuild } from "./getConfig";


export enum RCONError {
  NotAuthenticated,
  ServerUnreachable,
  RedundantAction,
  UnknownServerError,
}

export class RconClient {
  client: Rcon;

  constructor(client: Rcon) {
    this.client = client;
  }

  static async connect(login: RconGuild): Promise<RconClient> {
    try {
      const rcon = new Rcon({
        host: login.host,
        port: login.port,
        timeout: 3000,
      });

      await rcon.authenticate(login.password);

      return new RconClient(rcon);
    } catch (error) {
      localState.log.error("Failed to connect to RCON server", { error });
      throw RCONError.ServerUnreachable;
    }
  }

  public close(): Promise<void> {
    return this.client.disconnect();
  }

  public static async addUserToWhitelist(config: RconGuild, username: string): Promise<void> {
    const rcon = await this.connect(config);

    const response = await rcon.client.execute(`whitelist add ${username}`);

    if (typeof response === "boolean") {
      throw RCONError.NotAuthenticated;
    }

    if (response.includes("already whitelisted")) {
      throw RCONError.RedundantAction;
    }

    if (RegExp(/added (\w+) to the whitelist/).test(response)) {
      localState.log.error(`Failed to whitelist user, "${response}"`);
      throw RCONError.UnknownServerError;
    }

    await rcon.close();

    return;
  }

  public static async removeUserFromWhitelist(config: RconGuild, username: string): Promise<void> {
    const rcon = await this.connect(config);

    const response = await rcon.client.execute(`whitelist remove ${username}`);

    if (typeof response === "boolean") {
      throw RCONError.NotAuthenticated;
    }

    if (response.includes("not whitelisted")) {
      throw RCONError.RedundantAction;
    }

    if (RegExp(/removed (\w+) from the whitelist/).test(response)) {
      localState.log.error(`Failed to remove user from whitelist, "${response}"`);
      throw RCONError.UnknownServerError;
    }

    await rcon.close();

    return;
  }
}
