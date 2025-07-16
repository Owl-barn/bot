import { Rcon } from "rcon-client/lib";
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
      const client = await Rcon.connect(login);

      if (typeof client == "boolean") throw "client is false";

      return new RconClient(client);
    } catch (error) {
      localState.log.error("Failed to connect to RCON server", { error });
      throw RCONError.ServerUnreachable;
    }
  }

  public close(): Promise<void> {
    return this.client.end();
  }

  public static async addUserToWhitelist(config: RconGuild, username: string): Promise<void> {
    const rcon = await this.connect(config);

    const response = await rcon.client.send(`whitelist add ${username}`);

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

    const response = await rcon.client.send(`whitelist remove ${username}`);

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
