import axios, { AxiosResponse } from "axios";
import { localState } from "..";

export class MinecraftUser {
  public id: string;
  public name: string;

  constructor(id: string, username: string) {
    this.id = id;
    this.name = username;
  }

  // get account by username
  public static async fromUsername(username: string) {
    return this.fetchAccount(`https://api.minecraftservices.com/minecraft/profile/lookup/name/${username}`);
  }

  // get account by id
  public static async fromId(id: string) {
    return this.fetchAccount(`https://api.minecraftservices.com/minecraft/profile/lookup/${id}`);
  }

  private static async fetchAccount(url: string): Promise<MinecraftUser | null> {

    try {
      const response: AxiosResponse = await axios.get(url);

      const data = response.data;
      if (!data || !data.id || !data.name) {
        localState.log.error("Invalid response from Minecraft API", { data });
        return null;
      }

      return new MinecraftUser(data.id, data.name);

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status !== 404) {
          throw new Error(`Failed to fetch Minecraft account: ${error.message}`);
        }
      }

      return null;
    }
  }
}
